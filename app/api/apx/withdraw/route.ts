import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APX_MIN_REDEMPTION_APX, formatApx } from '@/lib/apx'
import { createNotification } from '@/lib/notifications'

const walletAddress = /^0x[a-fA-F0-9]{40}$/
const requestSchema = z.object({
  amount: z.number().finite().positive().min(APX_MIN_REDEMPTION_APX, `Minimum APX withdrawal is ${formatApx(APX_MIN_REDEMPTION_APX)} APX`),
  walletAddress: z.string().regex(walletAddress, 'Enter a valid BNB Smart Chain wallet address'),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.apxWithdrawal.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const input = requestSchema.parse(await req.json())
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: session.user.id }, select: { apxBalance: true } })
      if (!user) throw new Error('USER_NOT_FOUND')
      if (user.apxBalance < input.amount) throw new Error('INSUFFICIENT_APX')

      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: input.amount,
          currency: 'APX',
          walletAddress: input.walletAddress,
          network: 'BSC',
          note: `Manual APX payout requested: ${formatApx(input.amount)} APX`,
        },
      })

      const withdrawal = await tx.apxWithdrawal.create({
        data: {
          userId: session.user.id,
          transactionId: transaction.id,
          amount: input.amount,
          walletAddress: input.walletAddress,
          network: 'BSC',
        },
      })

      await tx.user.update({
        where: { id: session.user.id },
        data: { apxBalance: { decrement: input.amount } },
      })

      return withdrawal
    })

    await createNotification(
      session.user.id,
      'APX withdrawal request received',
      `${formatApx(input.amount)} APX has been reserved for manual payout to your BNB Smart Chain wallet.`,
      'info',
      '/dashboard/withdraw'
    )

    return NextResponse.json({ message: 'APX withdrawal request submitted', withdrawal: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (error instanceof Error && error.message === 'INSUFFICIENT_APX') return NextResponse.json({ error: 'Insufficient available APX rewards' }, { status: 400 })
    console.error('APX withdrawal request error:', error)
    return NextResponse.json({ error: 'Unable to submit APX withdrawal request' }, { status: 500 })
  }
}
