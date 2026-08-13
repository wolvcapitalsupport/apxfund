import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APX_EARNINGS_RATE, profitToApxAllocation, formatApx } from '@/lib/apx'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'ACTIVE'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 25

  const where: any = {}
  if (status !== 'ALL') where.status = status

  const [investments, total] = await Promise.all([
    prisma.investment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        plan: { select: { name: true, roiPercent: true, durationDays: true } },
      },
      orderBy: { endDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.investment.count({ where }),
  ])

  return NextResponse.json({ investments, total })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action, extendDays } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const inv = await prisma.investment.findUnique({ where: { id } })
  if (!inv) return NextResponse.json({ error: 'Investment not found' }, { status: 404 })

  if (action === 'pause') {
    await prisma.investment.update({ where: { id }, data: { isPaused: true } })
    return NextResponse.json({ message: 'ROI paused — daily profit will not run for this investment' })
  }

  if (action === 'resume') {
    await prisma.investment.update({ where: { id }, data: { isPaused: false } })
    return NextResponse.json({ message: 'ROI resumed — daily profit will run normally' })
  }

  if (action === 'cancel') {
    await prisma.$transaction([
      prisma.investment.update({
        where: { id },
        data: { status: 'CANCELLED', completedAt: new Date(), autoReinvest: false },
      }),
      prisma.user.update({
        where: { id: inv.userId },
        data: { balance: { increment: inv.amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: inv.userId,
          type: 'ADJUSTMENT',
          status: 'APPROVED',
          amount: inv.amount,
          note: `Investment cancelled by admin — capital refunded`,
        },
      }),
    ])
    return NextResponse.json({ message: 'Investment cancelled and capital refunded' })
  }

  if (action === 'toggleAutoReinvest') {
    await prisma.investment.update({
      where: { id },
      data: { autoReinvest: !inv.autoReinvest },
    })
    return NextResponse.json({ message: `Auto-reinvest ${!inv.autoReinvest ? 'enabled' : 'disabled'}` })
  }

  if (action === 'complete') {
    // Force-complete — admin manually matures an investment early.
    // Capital (principal) returned as USD. Profit converted to APX at current earnings rate.
    const profitUsd = inv.expectedProfit
    const alloc = profitToApxAllocation(profitUsd, APX_EARNINGS_RATE)

    await prisma.$transaction([
      prisma.investment.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date(), autoReinvest: false },
      }),
      // Principal returned to USD balance — this is NOT earnings
      prisma.user.update({
        where: { id: inv.userId },
        data: {
          balance: { increment: inv.amount },
          apxBalance: { increment: alloc.apxAmount },
          apxRewards: { increment: alloc.apxAmount },
          totalProfit: { increment: alloc.usdAmount },
        },
      }),
      // Capital return transaction (USD)
      prisma.transaction.create({
        data: {
          userId: inv.userId,
          type: 'PROFIT',
          status: 'APPROVED',
          amount: inv.amount,
          currency: 'USD',
          note: `Capital returned — investment manually completed by admin`,
        },
      }),
      // Profit as APX with full accounting fields
      prisma.transaction.create({
        data: {
          userId: inv.userId,
          type: 'APX_REWARD',
          status: 'APPROVED',
          amount: alloc.apxAmount,
          currency: 'APX',
          usdEquivalent: alloc.usdAmount,
          conversionRate: alloc.conversionRate,
          note: `ROI from admin force-complete: $${alloc.usdAmount.toFixed(2)} → ${formatApx(alloc.apxAmount)} APX @ $${alloc.conversionRate}/APX`,
        },
      }),
    ])
    return NextResponse.json({
      message: 'Investment force-completed — capital returned as USD, profit credited as APX',
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
