import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStarterPlan } from '@/lib/planRules'

// PATCH — user toggles "Stop Renewing" on their own ACTIVE investment.
// Not available on Starter Portfolio — its 2-cycle-then-migrate flow is
// fixed and never shows this toggle (see spec: Dashboard Changes).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    if (typeof body.autoReinvest !== 'boolean') {
      return NextResponse.json({ error: 'autoReinvest (boolean) is required' }, { status: 400 })
    }

    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      include: { plan: true },
    })

    if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 })
    if (investment.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (investment.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only active investments can be updated' }, { status: 400 })
    }
    if (isStarterPlan(investment.plan.name)) {
      return NextResponse.json({ error: 'Starter Portfolio auto-renews automatically and cannot be changed here' }, { status: 400 })
    }

    const updated = await prisma.investment.update({
      where: { id: params.id },
      data: { autoReinvest: body.autoReinvest },
    })

    return NextResponse.json({
      message: body.autoReinvest
        ? 'Auto-renew enabled — capital will roll into a new cycle at maturity'
        : 'Auto-renew stopped — capital and profit will be credited to your balance at maturity',
      investment: updated,
    })
  } catch (error) {
    console.error('Toggle auto-reinvest error:', error)
    return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 })
  }
}
