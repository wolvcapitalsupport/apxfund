import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInvestmentActivated } from '@/lib/mailer'
import { addDays } from 'date-fns'
import { z } from 'zod'

const migrateSchema = z.object({
  investmentId: z.string().min(1),
  targetPlanId: z.string().min(1),
  topUpAmount: z.number().min(0).default(0),
})

// POST — migrate a matured (or about-to-mature) contract's capital into a new plan,
// optionally topping up from balance to meet the new plan's minimum.
// Capital + topUp form the new contract. Profit from the OLD contract (if already
// matured) is credited to balance separately, never migrated.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { investmentId, targetPlanId, topUpAmount } = migrateSchema.parse(body)

    const [user, oldInvestment, targetPlan] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.investment.findUnique({ where: { id: investmentId }, include: { plan: true } }),
      prisma.plan.findUnique({ where: { id: targetPlanId } }),
    ])

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!oldInvestment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 })
    if (oldInvestment.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!targetPlan || !targetPlan.isActive) return NextResponse.json({ error: 'Target plan unavailable' }, { status: 400 })

    // Only allow migration on contracts that are ACTIVE (about to mature) or already COMPLETED
    if (!['ACTIVE', 'COMPLETED'].includes(oldInvestment.status)) {
      return NextResponse.json({ error: 'This investment cannot be migrated' }, { status: 400 })
    }

    const newCapital = oldInvestment.amount + topUpAmount

    if (newCapital < targetPlan.minAmount || newCapital > targetPlan.maxAmount) {
      return NextResponse.json(
        { error: `Total amount must be between $${targetPlan.minAmount.toLocaleString()} and $${targetPlan.maxAmount.toLocaleString()}. Your capital + top-up is $${newCapital.toFixed(2)}.` },
        { status: 400 }
      )
    }

    if (topUpAmount > 0 && user.balance < topUpAmount) {
      return NextResponse.json(
        { error: `Insufficient balance for top-up. You have $${user.balance.toFixed(2)} but need $${topUpAmount.toFixed(2)}.` },
        { status: 400 }
      )
    }

    const expectedProfit = parseFloat(((newCapital * targetPlan.roiPercent) / 100).toFixed(2))
    const endDate = addDays(new Date(), targetPlan.durationDays)

    const ops: any[] = [
      // Close the old contract permanently (mark as MIGRATED via status COMPLETED + note)
      prisma.investment.update({
        where: { id: oldInvestment.id },
        data: {
          status: 'COMPLETED',
          completedAt: oldInvestment.completedAt ?? new Date(),
          autoReinvest: false, // migrated, not auto-reinvested
        },
      }),
      // Create the new contract in the target plan
      prisma.investment.create({
        data: {
          userId: user.id,
          planId: targetPlan.id,
          amount: newCapital,
          expectedProfit,
          endDate,
          autoReinvest: true,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          status: 'APPROVED',
          amount: newCapital,
          note: `Migrated from ${oldInvestment.plan.name} to ${targetPlan.name}${topUpAmount > 0 ? ` (+$${topUpAmount.toFixed(2)} top-up)` : ''}`,
        },
      }),
    ]

    if (topUpAmount > 0) {
      ops.push(
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: topUpAmount } },
        })
      )
    }

    const [, newInvestment] = await prisma.$transaction(ops)

    await sendInvestmentActivated(
      user.email,
      user.fullName,
      targetPlan.name,
      newCapital,
      expectedProfit,
      targetPlan.durationDays,
      endDate
    )

    return NextResponse.json({
      message: `Migrated to ${targetPlan.name} successfully`,
      investment: newInvestment,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Failed to migrate investment' }, { status: 500 })
  }
}
