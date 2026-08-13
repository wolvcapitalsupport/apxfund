import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APX_REDEMPTION_RATE, APX_MIN_REDEMPTION_APX, APX_MIN_REDEMPTION_USD, apxToUsd, formatApx } from '@/lib/apx'
import { createNotification } from '@/lib/notifications'

const redeemSchema = z.object({
  apxAmount: z.number()
    .positive('APX amount must be greater than zero')
    .min(APX_MIN_REDEMPTION_APX, `Minimum redemption is ${APX_MIN_REDEMPTION_APX.toLocaleString()} APX ($${APX_MIN_REDEMPTION_USD.toLocaleString()} USD)`),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.apxRedemption.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { apxAmount } = redeemSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (user.apxBalance < apxAmount) {
      return NextResponse.json({ error: 'Insufficient APX balance' }, { status: 400 })
    }

    const usdValue = apxToUsd(apxAmount, APX_REDEMPTION_RATE)

    const [request] = await prisma.$transaction([
      prisma.apxRedemption.create({
        data: {
          userId: user.id,
          amount: apxAmount,
          rateUsd: APX_REDEMPTION_RATE,
          usdValue,
          status: 'PENDING',
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          apxBalance: { decrement: apxAmount },
        },
      }),
    ])

    await createNotification(
      user.id,
      'APX Redemption Requested',
      `Your request to redeem ${formatApx(apxAmount)} APX ($${usdValue.toFixed(2)}) has been queued for weekly/admin processing.`,
      'info',
      '/dashboard/apx'
    )

    return NextResponse.json({
      message: 'APX redemption request submitted',
      request,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to submit APX redemption' }, { status: 500 })
  }
}

