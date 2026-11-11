import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { formatApx } from '@/lib/apx'
import { recordAdminAudit } from '@/lib/admin-audit'

const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Enter a valid BNB Smart Chain transaction hash')

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = new URL(req.url).searchParams.get('status') || 'PENDING'
  const requests = await prisma.apxWithdrawal.findMany({
    where: status === 'ALL' ? {} : { status: status as any },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      transaction: { select: { id: true, status: true, createdAt: true } },
    },
    orderBy: { requestedAt: 'asc' },
    take: 200,
  })

  return NextResponse.json({ requests })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = typeof body.id === 'string' ? body.id : ''
  const action = body.action
  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : ''
  if (!id || !['pay', 'reject'].includes(action)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const row = await prisma.apxWithdrawal.findUnique({ where: { id }, include: { transaction: true } })
  if (!row) return NextResponse.json({ error: 'APX withdrawal request not found' }, { status: 404 })
  if (row.status !== 'PENDING') return NextResponse.json({ error: 'This APX withdrawal request has already been reviewed' }, { status: 400 })

  if (action === 'pay') {
    const txHashResult = txHashSchema.safeParse(body.txHash)
    if (!txHashResult.success) return NextResponse.json({ error: txHashResult.error.errors[0].message }, { status: 400 })

    const txHash = txHashResult.data.toLowerCase()
    const duplicate = await prisma.transaction.findFirst({ where: { txHash, id: { not: row.transactionId || undefined } }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: 'This transaction hash is already recorded' }, { status: 409 })

    await prisma.$transaction([
      prisma.apxWithdrawal.update({
        where: { id },
        data: { status: 'PAID', txHash, adminNote: adminNote || null, reviewedBy: session.user.id, reviewedAt: new Date(), paidAt: new Date() },
      }),
      ...(row.transactionId ? [prisma.transaction.update({
        where: { id: row.transactionId },
        data: { status: 'APPROVED', txHash, txProofHash: txHash, adminNote: adminNote || null, reviewedBy: session.user.id, reviewedAt: new Date(), note: `Manual APX payout sent: ${formatApx(row.amount)} APX on BNB Smart Chain` },
      })] : []),
    ])

    await createNotification(
      row.userId,
      'APX payout sent',
      `${formatApx(row.amount)} APX was sent to your wallet. Transaction: ${txHash}`,
      'success',
      '/dashboard/transactions'
    )

    await recordAdminAudit({
      adminId: session.user.id,
      action: 'APX_PAYOUT_PAID',
      entityType: 'APX_WITHDRAWAL',
      entityId: row.id,
      summary: `Marked ${formatApx(row.amount)} APX payout as paid`,
      after: { status: 'PAID', txHash },
      metadata: { userId: row.userId, walletAddress: row.walletAddress, network: row.network },
    })

    return NextResponse.json({ message: 'APX payout marked as paid' })
  }

  await prisma.$transaction([
    prisma.apxWithdrawal.update({
      where: { id },
      data: { status: 'REJECTED', adminNote: adminNote || null, reviewedBy: session.user.id, reviewedAt: new Date() },
    }),
    ...(row.transactionId ? [prisma.transaction.update({
      where: { id: row.transactionId },
      data: { status: 'REJECTED', adminNote: adminNote || null, reviewedBy: session.user.id, reviewedAt: new Date(), note: `Manual APX payout rejected: ${formatApx(row.amount)} APX returned to available rewards` },
    })] : []),
    prisma.user.update({ where: { id: row.userId }, data: { apxBalance: { increment: row.amount } } }),
  ])

  await createNotification(
    row.userId,
    'APX payout request rejected',
    `${formatApx(row.amount)} APX has been returned to your available rewards.${adminNote ? ` Note: ${adminNote}` : ''}`,
    'error',
    '/dashboard/withdraw'
  )

  await recordAdminAudit({
    adminId: session.user.id,
    action: 'APX_PAYOUT_REJECTED',
    entityType: 'APX_WITHDRAWAL',
    entityId: row.id,
    summary: `Rejected ${formatApx(row.amount)} APX payout and returned APX`,
    after: { status: 'REJECTED' },
    metadata: { userId: row.userId, walletAddress: row.walletAddress, network: row.network, adminNote: adminNote || null },
  })

  return NextResponse.json({ message: 'APX payout rejected and APX returned' })
}
