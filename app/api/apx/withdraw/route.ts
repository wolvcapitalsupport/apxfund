import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APX_MIN_REDEMPTION_APX, formatApx } from '@/lib/apx'
import { createNotification } from '@/lib/notifications'
import { sendWalletChangeAlert, sendWithdrawalSecurityAlert } from '@/lib/mailer'
import { checkRateLimit, getClientKey } from '@/lib/security'

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
  const limit = checkRateLimit(getClientKey(req, 'apx-withdraw'), 5, 15 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many withdrawal attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })

  try {
    const input = requestSchema.parse(await req.json())
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { apxBalance: true, payoutWalletAddress: true, payoutWalletChangedAt: true } })
    if (!user) throw new Error('USER_NOT_FOUND')
    const isNewAddress = user.payoutWalletAddress?.toLowerCase() !== input.walletAddress.toLowerCase()
    if (isNewAddress) {
      await prisma.user.update({ where: { id: session.user.id }, data: { payoutWalletAddress: input.walletAddress, payoutWalletChangedAt: new Date() } })
      const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, fullName: true } })
      if (account) await sendWalletChangeAlert(account.email, account.fullName, input.walletAddress)
      return NextResponse.json({ error: 'This payout address was saved and is on a 24-hour security hold. You can submit the withdrawal after the hold expires.' }, { status: 409 })
    }
    if (user.payoutWalletChangedAt && Date.now() - user.payoutWalletChangedAt.getTime() < 24 * 60 * 60 * 1000) {
      const remainingHours = Math.max(1, Math.ceil((24 * 60 * 60 * 1000 - (Date.now() - user.payoutWalletChangedAt.getTime())) / (60 * 60 * 1000)))
      return NextResponse.json({ error: `This payout address is on a security hold for approximately ${remainingHours} more hour(s).` }, { status: 409 })
    }
    if (user.apxBalance < input.amount) throw new Error('INSUFFICIENT_APX')
    const result = await prisma.$transaction(async tx => {

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

    const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, fullName: true } })
    if (account) await sendWithdrawalSecurityAlert(account.email, account.fullName, input.amount, input.walletAddress)

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
