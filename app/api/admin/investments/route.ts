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
    return NextResponse.json({ message: 'Maturity settlement paused for this investment' })
  }

  if (action === 'resume') {
    await prisma.investment.update({ where: { id }, data: { isPaused: false } })
    return NextResponse.json({ message: 'Maturity settlement resumed for this investment' })
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
    // Manual processing may settle only an actually matured investment. It
    // uses a conditional claim so cron/admin overlap cannot pay twice.
    if (new Date(inv.endDate) > new Date()) {
      return NextResponse.json({ error: 'Investment has not reached maturity yet' }, { status: 400 })
    }
    if (inv.legacyRoiReviewRequired) {
      return NextResponse.json({ error: 'Legacy ROI requires reconciliation before payout' }, { status: 409 })
    }
    const profitUsd = parseFloat(Math.max(0, inv.expectedProfit - inv.legacyRoiPaidUsd - inv.roiPaidUsd).toFixed(2))
    const alloc = profitToApxAllocation(profitUsd, APX_EARNINGS_RATE)

    const completed = await prisma.$transaction(async (tx) => {
      const claimed = await tx.investment.updateMany({
        where: { id, status: 'ACTIVE', endDate: { lte: new Date() }, legacyRoiReviewRequired: false },
        data: { status: 'COMPLETED', completedAt: new Date(), maturityProcessedAt: new Date(), lastRoiProcessedAt: new Date(), autoReinvest: false },
      })
      if (claimed.count !== 1) return false
      await tx.user.update({
        where: { id: inv.userId },
        data: { balance: { increment: inv.amount }, apxBalance: { increment: alloc.apxAmount }, apxRewards: { increment: alloc.apxAmount }, totalProfit: { increment: alloc.usdAmount } },
      })
      await tx.transaction.create({ data: { userId: inv.userId, investmentId: id, type: 'PROFIT', status: 'APPROVED', amount: inv.amount, currency: 'USD', note: 'Investment maturity principal returned to USD balance — admin processing' } })
      await tx.transaction.create({ data: { userId: inv.userId, investmentId: id, type: 'APX_REWARD', status: 'APPROVED', amount: alloc.apxAmount, currency: 'APX', usdEquivalent: alloc.usdAmount, conversionRate: alloc.conversionRate, note: `Maturity ROI credited to internal APX ledger only: $${alloc.usdAmount.toFixed(2)} → ${formatApx(alloc.apxAmount)} APX; no on-chain transfer` } })
      await tx.investment.update({ where: { id }, data: { roiPaidUsd: { increment: alloc.usdAmount }, roiPaidApx: { increment: alloc.apxAmount }, principalReturnedUsd: { increment: inv.amount } } })
      return true
    })
    if (!completed) return NextResponse.json({ error: 'Investment was already processed by another worker' }, { status: 409 })
    return NextResponse.json({
      message: 'Matured investment processed — capital returned as USD, profit credited to the internal APX ledger only',
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
