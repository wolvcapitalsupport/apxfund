import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    if (body.autoReinvest) {
      return NextResponse.json({ error: 'Automatic rollover is disabled. Investments settle once at maturity: USD principal returns to the USD balance and ROI is credited as internal APX.' }, { status: 400 })
    }

    const updated = await prisma.investment.update({
      where: { id: params.id },
      data: { autoReinvest: body.autoReinvest },
    })

    return NextResponse.json({
      message: 'Automatic rollover disabled — USD principal returns at maturity and ROI is credited as internal APX.',
      investment: updated,
    })
  } catch (error) {
    console.error('Toggle auto-reinvest error:', error)
    return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 })
  }
}
