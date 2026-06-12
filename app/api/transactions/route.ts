import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification, Notifs } from '@/lib/notifications'
import { sendDepositPending, sendWithdrawalPending } from '@/lib/mailer'
import { z } from 'zod'

const depositSchema = z.object({
  amount: z.number().min(10, 'Minimum deposit is $10'),
  currency: z.string().default('BTC'),
  txHash: z.string().min(5, 'Transaction hash is required'),
  proofImageUrl: z.string().url().optional(),
})

const withdrawSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal is $10'),
  walletAddress: z.string().min(10, 'Invalid wallet address'),
  currency: z.string().default('BTC'),
})

// POST — create a deposit or withdrawal request
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type } = body

    // ── DEPOSIT ─────────────────────────────────────────────
    if (type === 'DEPOSIT') {
      const { amount, currency, txHash, proofImageUrl } = depositSchema.parse(body)

      // Check for duplicate txHash
      const existing = await prisma.transaction.findFirst({ where: { txHash } })
      if (existing) {
        return NextResponse.json({ error: 'This transaction hash has already been submitted' }, { status: 400 })
      }

      // Create PENDING deposit — admin must approve before balance is credited
      const transaction = await prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: 'DEPOSIT',
          status: 'PENDING',
          amount,
          currency,
          txHash,
          proofImageUrl,
          note: `Deposit via ${currency}`,
        },
      })

      await createNotification(
        session.user.id,
        Notifs.depositPending(amount).title,
        Notifs.depositPending(amount).message,
        'info',
        '/dashboard/transactions'
      )

      // Send transactional email
      const userForEmail = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, fullName: true } })
      if (userForEmail) await sendDepositPending(userForEmail.email, userForEmail.fullName, amount, currency)

      return NextResponse.json({ message: 'Deposit submitted for review', transaction }, { status: 201 })
    }

    // ── WITHDRAWAL ──────────────────────────────────────────
    if (type === 'WITHDRAWAL') {
      const { amount, walletAddress, currency } = withdrawSchema.parse(body)

      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
      // Check completed investment rule
      const completedInvestment = await prisma.investment.findFirst({
        where: { userId: session.user.id, status: 'COMPLETED' },
      })
      if (!completedInvestment) {
        return NextResponse.json({ error: 'Withdrawals are only available after at least one investment plan has matured. Please invest and wait for your plan to complete.' }, { status: 400 })
      }

      if (user.balance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }

      // Deduct balance immediately and hold pending admin approval
      const [transaction] = await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: 'WITHDRAWAL',
            status: 'PENDING',
            amount,
            currency,
            walletAddress,
            note: `Withdrawal to ${currency} wallet`,
          },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            balance: { decrement: amount },
            totalWithdrawn: { increment: amount },
          },
        }),
      ])

      await createNotification(
        session.user.id,
        Notifs.withdrawalPending(amount).title,
        Notifs.withdrawalPending(amount).message,
        'info',
        '/dashboard/transactions'
      )

      // Send transactional email
      const userForEmail2 = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, fullName: true } })
      if (userForEmail2) await sendWithdrawalPending(userForEmail2.email, userForEmail2.fullName, amount, currency)

      return NextResponse.json({ message: 'Withdrawal request submitted', transaction }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Transaction error:', error)
    return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
  }
}

// GET — user's transaction history
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(transactions)
}
