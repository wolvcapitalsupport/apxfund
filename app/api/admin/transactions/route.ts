import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification, Notifs } from '@/lib/notifications'
import { sendDepositApproved, sendDepositRejected, sendWithdrawalApproved, sendWithdrawalRejected } from '@/lib/mailer'
import { recordAdminAudit } from '@/lib/admin-audit'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

// GET — list all pending/all transactions for admin
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'
  const type = searchParams.get('type') || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where: any = {}
  where.deletedAt = null
  if (status !== 'ALL') where.status = status
  if (type) where.type = type

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, balance: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json({ transactions, total, page, limit })
}

// PATCH — approve/reject deposits and withdrawals, or manage historical metadata
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transactionId, action, adminNote, txProofHash, note, txHash, walletAddress } = await req.json()

  if (!transactionId || !['approve', 'reject', 'edit', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { user: true },
  })

  if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  if (tx.deletedAt) return NextResponse.json({ error: 'Transaction has already been removed from history' }, { status: 404 })

  if (action === 'edit') {
    const cleanNote = typeof note === 'string' ? note.trim().slice(0, 1000) : undefined
    const cleanAdminNote = typeof adminNote === 'string' ? adminNote.trim().slice(0, 1000) : undefined
    const cleanTxHash = typeof txHash === 'string' ? txHash.trim().slice(0, 200) : undefined
    const cleanWalletAddress = typeof walletAddress === 'string' ? walletAddress.trim().slice(0, 200) : undefined
    if ([cleanNote, cleanAdminNote, cleanTxHash, cleanWalletAddress].every(value => value === undefined)) {
      return NextResponse.json({ error: 'No editable transaction fields supplied' }, { status: 400 })
    }
    const before = { note: tx.note, adminNote: tx.adminNote, txHash: tx.txHash, walletAddress: tx.walletAddress }
    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        ...(cleanNote !== undefined ? { note: cleanNote || null } : {}),
        ...(cleanAdminNote !== undefined ? { adminNote: cleanAdminNote || null } : {}),
        ...(cleanTxHash !== undefined ? { txHash: cleanTxHash || null } : {}),
        ...(cleanWalletAddress !== undefined ? { walletAddress: cleanWalletAddress || null } : {}),
        editedAt: new Date(),
        editedBy: session.user.id,
      },
    })
    await recordAdminAudit({
      adminId: session.user.id,
      action: 'TRANSACTION_EDITED',
      entityType: 'TRANSACTION',
      entityId: tx.id,
      summary: `Edited ${tx.type} transaction for ${tx.user.email}`,
      before,
      after: { note: updated.note, adminNote: updated.adminNote, txHash: updated.txHash, walletAddress: updated.walletAddress },
    })
    return NextResponse.json({ message: 'Transaction details updated', transaction: updated })
  }

  if (action === 'delete') {
    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    })
    await recordAdminAudit({
      adminId: session.user.id,
      action: 'TRANSACTION_SOFT_DELETED',
      entityType: 'TRANSACTION',
      entityId: tx.id,
      summary: `Removed ${tx.type} transaction from ${tx.user.email}'s history`,
      before: { status: tx.status, amount: tx.amount, currency: tx.currency, note: tx.note },
      after: { deletedAt: updated.deletedAt, deletedBy: session.user.id },
      metadata: { balanceImpact: 'none', recovery: 'restore deletedAt/deletedBy fields' },
    })
    return NextResponse.json({ message: 'Transaction removed from history' })
  }

  if (tx.status !== 'PENDING') {
    return NextResponse.json({ error: 'Transaction already reviewed' }, { status: 400 })
  }

  const now = new Date()

  if (action === 'approve') {
    // ── APPROVE ────────────────────────────────────────────
    if (tx.type === 'DEPOSIT') {
      // Credit user balance and update totals
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'APPROVED',
            adminNote: adminNote || null,
          },
        }),
        prisma.user.update({
          where: { id: tx.userId },
          data: {
            balance: { increment: tx.amount },
            totalDeposited: { increment: tx.amount },
          },
        }),
      ])

      await createNotification(tx.userId, Notifs.depositApproved(tx.amount).title, Notifs.depositApproved(tx.amount).message, 'success', '/dashboard')
      await sendDepositApproved(tx.user.email, tx.user.fullName, tx.amount, tx.currency || 'Crypto')
    } else if (tx.type === 'WITHDRAWAL') {
      if (!txProofHash || String(txProofHash).trim().length < 10) {
        return NextResponse.json({ error: 'Withdrawal TX proof hash is required for approval' }, { status: 400 })
      }

      // Mark as approved — funds already deducted on request
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: 'APPROVED',
          adminNote: adminNote || null,
          txProofHash: String(txProofHash).trim(),
        },
      })

      await createNotification(tx.userId, Notifs.withdrawalApproved(tx.amount).title, Notifs.withdrawalApproved(tx.amount).message, 'success', '/dashboard/transactions')
      await sendWithdrawalApproved(tx.user.email, tx.user.fullName, tx.amount, tx.currency || 'Crypto', String(txProofHash).trim())
    }

    return NextResponse.json({ message: 'Transaction approved' })
  } else {
    // ── REJECT ─────────────────────────────────────────────
    if (tx.type === 'WITHDRAWAL') {
      // Refund the withheld balance back to user
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'REJECTED',
            adminNote: adminNote || null,
          },
        }),
        prisma.user.update({
          where: { id: tx.userId },
          data: {
            balance: { increment: tx.amount },
            totalWithdrawn: { decrement: tx.amount },
          },
        }),
      ])

      await createNotification(tx.userId, Notifs.withdrawalRejected(tx.amount, adminNote).title, Notifs.withdrawalRejected(tx.amount, adminNote).message, 'error', '/dashboard/transactions')
      await sendWithdrawalRejected(tx.user.email, tx.user.fullName, tx.amount, adminNote)
    } else if (tx.type === 'DEPOSIT') {
      // Deposit was never credited — just mark rejected
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          status: 'REJECTED',
          adminNote: adminNote || null,
        },
      })

      await createNotification(tx.userId, Notifs.depositRejected(tx.amount, adminNote).title, Notifs.depositRejected(tx.amount, adminNote).message, 'error', '/dashboard/transactions')
      await sendDepositRejected(tx.user.email, tx.user.fullName, tx.amount, adminNote)
    }

    return NextResponse.json({ message: 'Transaction rejected' })
  }
}
