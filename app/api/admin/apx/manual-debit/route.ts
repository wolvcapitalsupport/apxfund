import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

const manualDebitSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  amount: z.number().positive('APX amount must be greater than zero'),
  walletAddress: z.string().min(10, 'Wallet address is required'),
  txHash: z.string().min(10, 'Transaction hash is required'),
  adminNote: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const session = await requireAdmin()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = manualDebitSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        apxBalance: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.apxBalance < data.amount) {
      return NextResponse.json(
        {
          error: `Insufficient APX balance. User has ${user.apxBalance.toFixed(2)} APX.`,
        },
        { status: 400 }
      )
    }

    const existingTx = await prisma.transaction.findFirst({
      where: {
        txHash: data.txHash.trim(),
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        type: true,
      },
    })

    if (existingTx) {
      return NextResponse.json(
        {
          error: 'This transaction hash has already been recorded.',
        },
        { status: 400 }
      )
    }

    const amount = data.amount
    const txHash = data.txHash.trim()
    const walletAddress = data.walletAddress.trim()
    const adminNote = data.adminNote?.trim() || null

    const result = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          fullName: true,
          apxBalance: true,
        },
      })

      if (!currentUser) {
        throw new Error('User not found')
      }

      if (currentUser.apxBalance < amount) {
        throw new Error(
          `Insufficient APX balance. User has ${currentUser.apxBalance.toFixed(2)} APX.`
        )
      }

      const updatedUser = await tx.user.update({
        where: { id: data.userId },
        data: {
          apxBalance: {
            decrement: amount,
          },
        },
        select: {
          apxBalance: true,
        },
      })

      const transaction = await tx.transaction.create({
        data: {
          userId: data.userId,
          type: 'ADJUSTMENT',
          status: 'COMPLETED',
          amount,
          currency: 'APX',
          txHash,
          walletAddress,
          adminNote,
          note: `Manual APX payout: ${amount.toFixed(2)} APX`,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          network: 'BSC',
        },
      })

      return {
        transaction,
        remainingApx: updatedUser.apxBalance,
      }
    })

    await createNotification(
      user.id,
      'APX Balance Adjusted',
      `${amount.toFixed(2)} APX has been recorded as a manual external payout to your wallet.`,
      'info',
      '/dashboard/transactions'
    )

    return NextResponse.json({
      message: 'Manual APX debit recorded successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
      },
      amount,
      remainingApx: result.remainingApx,
      txHash,
      transactionId: result.transaction.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : ''

    if (message.startsWith('Insufficient APX balance')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    console.error('Manual APX debit error:', error)

    return NextResponse.json(
      { error: 'Failed to record manual APX debit' },
      { status: 500 }
    )
  }
}
