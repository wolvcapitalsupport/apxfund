import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { createNotification, Notifs } from '@/lib/notifications'
import { sendInvestmentMatured, sendPlanUpgradeNudge, sendMigrationAvailable, sendCycleRenewed } from '@/lib/mailer'
import { isStarterPlan, computeMigrationOptions, MAX_STARTER_CYCLES } from '@/lib/planRules'
import { addDays } from 'date-fns'

export async function GET(req: NextRequest) {
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
    const now = new Date()

    // Find all ACTIVE investments
    const activeInvestments = await prisma.investment.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true, user: true },
    })

    // Full plan catalog, used to compute migration top-up options for
    // Starter Portfolio graduates (cycle 2 completions)
    const allPlans = await prisma.plan.findMany({ select: { id: true, name: true, minAmount: true } })

    console.log(`[ROI Engine] Found ${activeInvestments.length} active investments`)

    for (const inv of activeInvestments) {
      try {
        // Skip paused investments entirely
        if (inv.isPaused) {
          console.log(`[ROI Engine] ⏸ Skipped paused investment ${inv.id} — ${inv.user.email}`)
          continue
        }

        const isMature = now >= new Date(inv.endDate)
        const dailyProfit = parseFloat(((inv.amount * inv.plan.roiPercent) / 100 / inv.plan.durationDays).toFixed(2))

        type MaturityResult = {
          migrationEmailPayload: { lockedCapital: number; options: ReturnType<typeof computeMigrationOptions> } | null
          maturityOutcome: 'released' | 'renewed' | null
          renewedCycleNumber?: number
        }

        const result: MaturityResult = await prisma.$transaction(async (tx): Promise<MaturityResult> => {
          let migrationEmailPayload: MaturityResult['migrationEmailPayload'] = null
          let maturityOutcome: MaturityResult['maturityOutcome'] = null
          let renewedCycleNumber: number | undefined
          if (isMature) {
            const starter = isStarterPlan(inv.plan.name)

            // Profit is always credited to balance and withdrawable at maturity,
            // regardless of plan type or rollover behavior.
            await tx.user.update({
              where: { id: inv.userId },
              data: {
                balance: { increment: dailyProfit },
                totalProfit: { increment: dailyProfit },
              },
            })

            await tx.transaction.create({
              data: {
                userId: inv.userId,
                type: TransactionType.PROFIT,
                status: TransactionStatus.APPROVED,
                amount: dailyProfit,
                note: `Final daily ROI from ${inv.plan.name}${starter ? ' (capital remains locked)' : ''}`,
              },
            })

            await tx.investment.update({
              where: { id: inv.id },
              data: { status: 'COMPLETED', completedAt: now },
            })

            if (starter) {
              // ── Starter Portfolio: capital never released here ──────
              if (inv.cycleNumber === 1) {
                // Auto-create cycle 2 with the same capital
                const newEndDate = addDays(now, inv.plan.durationDays)
                const newExpectedProfit = parseFloat(((inv.amount * inv.plan.roiPercent) / 100).toFixed(2))
                await tx.investment.create({
                  data: {
                    userId: inv.userId,
                    planId: inv.planId,
                    amount: inv.amount,
                    expectedProfit: newExpectedProfit,
                    endDate: newEndDate,
                    cycleNumber: 2,
                    autoReinvest: false, // forced — no cycle 3
                  },
                })
                await tx.user.update({
                  where: { id: inv.userId },
                  data: { starterCyclesUsed: MAX_STARTER_CYCLES },
                })
                maturityOutcome = 'renewed'
                renewedCycleNumber = 1
              } else {
                // Cycle 2 complete — lock capital, flag for migration
                await tx.user.update({
                  where: { id: inv.userId },
                  data: { awaitingMigration: true, lockedCapital: inv.amount },
                })
                migrationEmailPayload = {
                  lockedCapital: inv.amount,
                  options: computeMigrationOptions(inv.amount, allPlans),
                }
              }
            } else {
              // ── Growth / Apex / Sovereign ────────────────────────────
              if (inv.autoReinvest) {
                // Default: auto-roll — capital stays invested, new cycle starts
                const newEndDate = addDays(now, inv.plan.durationDays)
                const newExpectedProfit = parseFloat(((inv.amount * inv.plan.roiPercent) / 100).toFixed(2))
                await tx.investment.create({
                  data: {
                    userId: inv.userId,
                    planId: inv.planId,
                    amount: inv.amount,
                    expectedProfit: newExpectedProfit,
                    endDate: newEndDate,
                    autoReinvest: true,
                  },
                })
                maturityOutcome = 'renewed'
              } else {
                // Opted out — release capital + profit to balance
                await tx.user.update({
                  where: { id: inv.userId },
                  data: { balance: { increment: inv.amount } },
                })
                await tx.transaction.create({
                  data: {
                    userId: inv.userId,
                    type: TransactionType.PROFIT,
                    status: TransactionStatus.APPROVED,
                    amount: inv.amount,
                    note: `Capital returned from ${inv.plan.name} — auto-renew stopped`,
                  },
                })
                maturityOutcome = 'released'
              }
            }

            // Referral bonus on maturity
            if (inv.user.referredBy) {
              const referralBonus = parseFloat(((inv.amount * inv.plan.referralBonus) / 100).toFixed(2))
              const referrer = await tx.user.findUnique({
                where: { id: inv.user.referredBy },
                select: { id: true, isActive: true },
              })
              if (referrer?.isActive && referralBonus > 0) {
                await tx.user.update({
                  where: { id: referrer.id },
                  data: { balance: { increment: referralBonus }, totalProfit: { increment: referralBonus } },
                })
                await tx.transaction.create({
                  data: {
                    userId: referrer.id,
                    type: TransactionType.REFERRAL,
                    status: TransactionStatus.APPROVED,
                    amount: referralBonus,
                    note: `Referral bonus from ${inv.user.fullName}'s ${inv.plan.name}`,
                  },
                })
                await createNotification(
                  referrer.id,
                  ...Object.values(Notifs.referralBonus(referralBonus)) as [string, string, 'success', string]
                )
              }
            }

            if (maturityOutcome === 'renewed') {
              await sendCycleRenewed(inv.user.email, inv.user.fullName, inv.plan.name, inv.amount, dailyProfit, renewedCycleNumber)
            } else if (maturityOutcome === 'released') {
              await sendInvestmentMatured(inv.user.email, inv.user.fullName, inv.plan.name, inv.amount, dailyProfit)
            }
            // Starter cycle-2 completions get the migration email instead (sent after the transaction commits)
            await createNotification(
              inv.userId,
              Notifs.profitCredited(dailyProfit, inv.plan.name).title,
              Notifs.profitCredited(dailyProfit, inv.plan.name).message,
              'success',
              '/dashboard'
            )

            return { migrationEmailPayload, maturityOutcome, renewedCycleNumber }
          } else {
            // Daily ROI credit — keep investment ACTIVE
            await tx.user.update({
              where: { id: inv.userId },
              data: {
                balance: { increment: dailyProfit },
                totalProfit: { increment: dailyProfit },
              },
            })

            await tx.transaction.create({
              data: {
                userId: inv.userId,
                type: TransactionType.PROFIT,
                status: TransactionStatus.APPROVED,
                amount: dailyProfit,
                note: `Daily ROI from ${inv.plan.name} — day ${Math.floor((now.getTime() - new Date(inv.startDate).getTime()) / 86400000) + 1} of ${inv.plan.durationDays}`,
              },
            })

            await createNotification(
              inv.userId,
              `Daily profit credited`,
              `$${dailyProfit.toFixed(2)} ROI credited from your ${inv.plan.name} investment.`,
              'success',
              '/dashboard'
            )

            return { migrationEmailPayload: null, maturityOutcome: null }
          }
        })

        if (result.migrationEmailPayload) {
          await sendMigrationAvailable(
            inv.user.email,
            inv.user.fullName,
            result.migrationEmailPayload.lockedCapital,
            result.migrationEmailPayload.options
          )
          await createNotification(
            inv.userId,
            '🔓 Migration Available',
            `Your Starter Portfolio has completed both cycles. Migrate your $${inv.amount.toFixed(2)} locked capital to a higher plan to release it.`,
            'info',
            '/dashboard/plans'
          )
        }

        investmentsDone++
        totalProfitPaid += dailyProfit
        console.log(`[ROI Engine] ✅ ${inv.id} — ${inv.user.email} — $${dailyProfit} — ${isMature ? 'MATURED' : 'daily'}`)
      } catch (invError: any) {
        const errMsg = `Investment ${inv.id}: ${invError.message}`
        errors.push(errMsg)
        console.error(`[ROI Engine] ❌ ${errMsg}`)
      }
    }

    await prisma.roiProcessingLog.create({
      data: {
        investmentsFound: activeInvestments.length,
        investmentsDone,
        totalProfitPaid,
        errors: errors.length > 0 ? errors.join('; ') : undefined,
      },
    })

    const duration = Date.now() - startTime
    console.log(`[ROI Engine] Done in ${duration}ms — ${investmentsDone}/${activeInvestments.length} — $${totalProfitPaid.toFixed(2)} paid`)

    return NextResponse.json({
      success: true,
      investmentsFound: activeInvestments.length,
      investmentsDone,
      totalProfitPaid,
      durationMs: duration,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[ROI Engine] Fatal error:', error)
    await prisma.roiProcessingLog.create({
      data: {
        investmentsDone,
        totalProfitPaid,
        errors: `Fatal: ${error.message}`,
      },
    })
    return NextResponse.json({ error: 'ROI engine failed', detail: error.message }, { status: 500 })
  }
}
