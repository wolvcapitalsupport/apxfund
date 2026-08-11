import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APX_BUY_RATE, formatApx, usdToApx } from '@/lib/apx'
import { createNotification } from '@/lib/notifications'

const buySchema = z.object({
  usdAmount: z.number().min(10, 'Minimum APX purchase is $10'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { usdAmount } = buySchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.balance < usdAmount) {
      return NextResponse.json({ error: 'Insufficient USD balance' }, { status: 400 })
    }

    const apxAmount = usdToApx(usdAmount, APX_BUY_RATE)

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: usdAmount },
          apxBalance: { increment: apxAmount },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'APX_BUY',
          status: 'APPROVED',
          amount: usdAmount,
          currency: 'USD',
          note: `Bought ${formatApx(apxAmount)} APX at $${APX_BUY_RATE} per APX`,
        },
      }),
    ])

    await createNotification(
      user.id,
      'APX Purchase Completed',
      `You bought ${formatApx(apxAmount)} APX for $${usdAmount.toFixed(2)}.`,
      'success',
      '/dashboard/apx'
    )

    return NextResponse.json({
      message: 'APX purchased successfully',
      apxAmount,
      usdAmount,
      rate: APX_BUY_RATE,
      balances: {
        usd: updatedUser.balance,
        apx: updatedUser.apxBalance,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to buy APX' }, { status: 500 })
  }
}
