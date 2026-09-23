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

    // For decentralized version, we don't update internal balances
    // Instead, we provide information for the user to swap on PancakeSwap
    const apxAmount = usdToApx(usdAmount, APX_BUY_RATE)

    // In a real implementation, we would:
    // 1. Calculate the required input amount (BNB/USDT) for the swap
    // 2. Provide swap transaction data for the user to execute
    // 3. Or facilitate the swap via our interface

    // For now, we'll return the calculated amounts and instructions
    return NextResponse.json({
      message: 'Ready to swap for APX on PancakeSwap',
      usdAmount,
      apxAmount: formatApx(apxAmount),
      buyRate: APX_BUY_RATE,
      instructions: 'Connect your wallet and use the swap feature to exchange BNB/USDT for APX on PancakeSwap',
      // In future: provide swap transaction data
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process APX purchase' }, { status: 500 })
  }
}