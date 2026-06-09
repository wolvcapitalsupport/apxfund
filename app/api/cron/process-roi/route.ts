import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification, Notifs } from '@/lib/notifications'

/**
 * ROI Engine — runs on a schedule (Vercel Cron or external trigger).
 * Finds all ACTIVE investments whose endDate has passed,
 * credits principal + profit to the user, creates a PROFIT transaction,
 * handles referral bonus, and logs the run.
 *
 * Protected by CRON_SECRET env variable.
 * Schedule: every hour  →  add to vercel.json:
 * { "crons": [{ "path": "/api/cron/process-roi", "schedule": "0 * * * *" }] }
 */
export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  let investmentsDone = 0
  let totalProfitPaid = 0
  const errors: string[] = []

  try {
    // ── Find all matured, active investments ────────────────
    const dueInvestments = await prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: new Date() },
      },
      include: {
        plan: true,
        user: true,
      },
    })

    console.log(`[ROI Engine] Found ${dueInvestments.length} matured investments`)

    for (const inv of dueInvestments) {
      try {
        const totalReturn = inv.amount + inv.expectedProfit

        // ── Atomic transaction: complete investment + credit user ──
        await prisma.$transaction(async (tx) => {
          // 1. Mark investment as completed
          await tx.investment.update({
            where: { id: inv.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          })

          // 2. Credit principal + profit back to user balance
          await tx.user.update({
            where: { id: inv.userId },
            data: {
              balance: { increment: totalReturn },
              totalProfit: { increment: inv.expectedProfit },
            },
          })

          // 3. Create profit transaction record
          await tx.transaction.create({
            data: {
              userId: inv.userId,
              type: 'PROFIT',
              status: 'COMPLETED',
              amount: inv.expectedProfit,
              note: `ROI from ${inv.plan.name} — ${inv.plan.roiPercent}% over ${inv.plan.durationDays} day(s)`,
            },
          })

          // 4. Handle referral bonus if user was referred
          if (inv.user.referredBy) {
            const referralBonus = (inv.amount * inv.plan.referralBonus) / 100

            const referrer = await tx.user.findUnique({
              where: { id: inv.user.referredBy },
              select: { id: true, isActive: true },
            })

            if (referrer?.isActive) {
              await tx.user.update({
                where: { id: referrer.id },
                data: {
                  balance: { increment: referralBonus },
                  totalProfit: { increment: referralBonus },
                },
              })

              await tx.transaction.create({
                data: {
                  userId: referrer.id,
                  type: 'REFERRAL_BONUS',
                  status: 'COMPLETED',
                  amount: referralBonus,
                  note: `Referral bonus from ${inv.user.fullName}'s ${inv.plan.name} investment`,
                },
              })

              // Notify referrer
              await createNotification(
                referrer.id,
                ...Object.values(Notifs.referralBonus(referralBonus)) as [string, string, 'success', string]
              )
            }
          }
        })

        // ── Send user notification ──────────────────────────
        await createNotification(
          inv.userId,
          Notifs.profitCredited(inv.expectedProfit, inv.plan.name).title,
          Notifs.profitCredited(inv.expectedProfit, inv.plan.name).message,
          'success',
          '/dashboard'
        )

        investmentsDone++
        totalProfitPaid += inv.expectedProfit

        console.log(
          `[ROI Engine] ✅ Investment ${inv.id} — User: ${inv.user.email} — Profit: $${inv.expectedProfit.toFixed(2)}`
        )
      } catch (invError: any) {
        const errMsg = `Investment ${inv.id}: ${invError.message}`
        errors.push(errMsg)
        console.error(`[ROI Engine] ❌ ${errMsg}`)
      }
    }

    // ── Log this run ────────────────────────────────────────
    await prisma.roiProcessingLog.create({
      data: {
        investmentsFound: dueInvestments.length,
        investmentsDone,
        totalProfitPaid,
        errors: errors.length > 0 ? errors.join('\n') : null,
      },
    })

    const duration = Date.now() - startTime
    console.log(
      `[ROI Engine] Run complete in ${duration}ms — ${investmentsDone}/${dueInvestments.length} processed — $${totalProfitPaid.toFixed(2)} paid`
    )

    return NextResponse.json({
      success: true,
      investmentsFound: dueInvestments.length,
      investmentsDone,
      totalProfitPaid,
      durationMs: duration,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[ROI Engine] Fatal error:', error)

    await prisma.roiProcessingLog.create({
      data: {
        investmentsFound: 0,
        investmentsDone,
        totalProfitPaid,
        errors: `Fatal: ${error.message}`,
      },
    })

    return NextResponse.json({ error: 'ROI engine failed', detail: error.message }, { status: 500 })
  }
}
