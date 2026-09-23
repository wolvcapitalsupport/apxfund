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

  // For decentralized version, we don't store redemption requests internally
  // Users can view their APX balance and transaction history in their wallet
  // We could optionally return swap history or other relevant data

  return NextResponse.json([]) // Empty array for now
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { apxAmount } = redeemSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if user has sufficient APX balance in their wallet (would be checked frontend)
    // For now, we'll just validate the amount is positive

    const usdValue = apxToUsd(apxAmount, APX_REDEMPTION_RATE)

    // For decentralized version, we don't create internal redemption requests
    // Instead, we facilitate the swap on PancakeSwap

    return NextResponse.json({
      message: 'Ready to swap APX for USD value on PancakeSwap',
      apxAmount: formatApx(apxAmount),
      usdValue: usdValue.toFixed(2),
      redeemRate: APX_REDEMPTION_RATE,
      instructions: 'Connect your wallet and use the swap feature to exchange APX for BNB/USDT on PancakeSwap',
      // In future: provide swap transaction data for selling APX
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process APX redemption' }, { status: 500 })
  }
}