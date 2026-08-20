import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { createNotification, Notifs } from '@/lib/notifications'
import { sendInvestmentMatured, sendMigrationAvailable, sendCycleRenewed } from '@/lib/mailer'
import { isStarterPlan, computeMigrationOptions, MAX_STARTER_CYCLES } from '@/lib/planRules'
import { addDays } from 'date-fns'
import { APX_EARNINGS_RATE, profitToApxAllocation, formatApx } from '@/lib/apx'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  let investmentsDone = 0
  let totalProfitPaid = 0 // tracked in USD for the processing log
  const errors: string[] = []

  try {
    const now = new Date()

    const activeInvestments = await prisma.investment.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true, user: true },
    })

    const allPlans = await prisma.plan.findMany({
      select: { id: true, name: true, minAmount: true },
    })

    console.log(`[ROI Engine] Found ${activeInvestments.length} active investments`)

    for (const inv of activeInvestments) {
      try {
        if (inv.isPaused) {
          console.log(`[ROI Engine] ⏸ Skipped paused ${inv.id} — ${inv.user.email}`)
          continue
        }

        const isMature = now >= new Date(inv.endDate)
        const dailyProfit = parseFloat(
          ((inv.amount * inv.plan.roiPercent) / 100 / inv.plan.durationDays).toFixed(2)
        )
        // Lock the conversion at the current earnings rate — stored on each record
        const alloc = profitToApxAllocation(dailyProfit, APX_EARNINGS_RATE)

        type MaturityResult = {
          migrationEmailPayload: {
            lockedCapital: number
            options: ReturnType<typeof computeMigrationOptions>
          } | null
          maturityOutcome: 'released' | 'renewed' | null
          renewedCycleNumber?: number
        }

        const result: MaturityResult = await prisma.$transaction(
          async (tx): Promise<MaturityResult> => {
            let migrationEmailPayload: MaturityResult['migrationEmailPayload'] = null
            let maturityOutcome: MaturityResult['maturityOutcome'] = null
            let renewedCycleNumber: number | undefined

            if (isMature) {
              const starter = isStarterPlan(inv.plan.name)

              // ── Credit earnings as APX ──────────────────────────────────
              // totalProfit preserved in USD for platform-level accounting.
              // apxBalance / apxRewards accumulate the actual allocated tokens.
              await tx.user.update({
                where: { id: inv.userId },
                data: {
                  apxBalance: { increment: alloc.apxAmount },
                  apxRewards: { increment: alloc.apxAmount },
                  totalProfit: { increment: alloc.usdAmount },
                },
              })

              await tx.transaction.create({
                data: {
                  userId: inv.userId,
                  type: TransactionType.APX_REWARD,
                  status: TransactionStatus.APPROVED,
                  amount: alloc.apxAmount,
                  currency: 'APX',
                  usdEquivalent: alloc.usdAmount,
                  conversionRate: alloc.conversionRate,
                  note: `Maturity ROI from ${inv.plan.name}: $${alloc.usdAmount.toFixed(2)} → ${formatApx(alloc.apxAmount)} APX @ $${alloc.conversionRate}/APX`,
                },
              })

              // NOTE: The separate 8% APX maturity bonus (rewardApxFromProfit) is
              // intentionally removed. All earnings are now converted to APX above.

              await tx.investment.update({
                where: { id: inv.id },
                data: { status: 'COMPLETED', completedAt: now },
              })

              if (starter) {
                if (inv.cycleNumber === 1) {
                  // Auto-create cycle 2 — capital stays locked
                  const newEndDate = addDays(now, inv.plan.durationDays)
                  const newExpectedProfit = parseFloat(
                    ((inv.amount * inv.plan.roiPercent) / 100).toFixed(2)
                  )
                  await tx.investment.create({
                    data: {
                      userId: inv.userId,
                      planId: inv.planId,
                      amount: inv.amount,
                      expectedProfit: newExpectedProfit,
                      endDate: newEndDate,
                      cycleNumber: 2,
                      autoReinvest: false,
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
                // ── Growth / Apex / Sovereign ───────────────────────────
                if (inv.autoReinvest) {
                  const newEndDate = addDays(now, inv.plan.durationDays)
                  const newExpectedProfit = parseFloat(
                    ((inv.amount * inv.plan.roiPercent) / 100).toFixed(2)
                  )
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
                  // ── Capital return — principal only, NOT converted to APX ──
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
                      currency: 'USD',
                      note: `Capital returned from ${inv.plan.name} — auto-renew stopped`,
                    },
                  })
                  maturityOutcome = 'released'
                }
              }

              // ── Referral bonus — paid as APX, not USD ───────────────────
              if (inv.user.referredBy) {
                const referralUsd = parseFloat(
                  ((inv.amount * inv.plan.referralBonus) / 100).toFixed(2)
                )
                const referralAlloc = profitToApxAllocation(referralUsd, APX_EARNINGS_RATE)
                const referrer = await tx.user.findUnique({
                  where: { id: inv.user.referredBy },
                  select: { id: true, isActive: true },
                })
                if (referrer?.isActive && referralUsd > 0) {
                  await tx.user.update({
                    where: { id: referrer.id },
                    data: {
                      apxBalance: { increment: referralAlloc.apxAmount },
                      apxRewards: { increment: referralAlloc.apxAmount },
                      totalProfit: { increment: referralAlloc.usdAmount },
                    },
                  })
                  await tx.transaction.create({
                    data: {
                      userId: referrer.id,
                      type: TransactionType.REFERRAL,
                      status: TransactionStatus.APPROVED,
                      amount: referralAlloc.apxAmount,
                      currency: 'APX',
                      usdEquivalent: referralAlloc.usdAmount,
                      conversionRate: referralAlloc.conversionRate,
                      note: `Referral bonus from ${inv.user.fullName}'s ${inv.plan.name}: $${referralAlloc.usdAmount.toFixed(2)} → ${formatApx(referralAlloc.apxAmount)} APX @ $${referralAlloc.conversionRate}/APX`,
                    },
                  })
                  await createNotification(
                    referrer.id,
                    'Referral Bonus — APX Credited',
                    `${formatApx(referralAlloc.apxAmount)} APX ($${referralAlloc.usdAmount.toFixed(2)}) credited from ${inv.user.fullName}'s ${inv.plan.name} maturity.`,
                    'success',
                    '/dashboard/apx'
                  )
                }
              }

              if (maturityOutcome === 'renewed') {
                await sendCycleRenewed(
                  inv.user.email,
                  inv.user.fullName,
                  inv.plan.name,
                  inv.amount,
                  alloc.usdAmount,
                  renewedCycleNumber
                )
              } else if (maturityOutcome === 'released') {
                await sendInvestmentMatured(
                  inv.user.email,
                  inv.user.fullName,
                  inv.plan.name,
                  inv.amount,
                  alloc.usdAmount
                )
              }

              await createNotification(
                inv.userId,
                'ROI Credited as APX',
                `${formatApx(alloc.apxAmount)} APX ($${alloc.usdAmount.toFixed(2)}) credited from your ${inv.plan.name}.`,
                'success',
                '/dashboard/apx'
              )

              return { migrationEmailPayload, maturityOutcome, renewedCycleNumber }

            } else {
              // ── Daily ROI — investment stays ACTIVE ────────────────────
              await tx.user.update({
                where: { id: inv.userId },
                data: {
                  apxBalance: { increment: alloc.apxAmount },
                  apxRewards: { increment: alloc.apxAmount },
                  totalProfit: { increment: alloc.usdAmount },
                },
              })

              const dayNum =
                Math.floor(
                  (now.getTime() - new Date(inv.startDate).getTime()) / 86_400_000
                ) + 1

              await tx.transaction.create({
                data: {
                  userId: inv.userId,
                  type: TransactionType.APX_REWARD,
                  status: TransactionStatus.APPROVED,
                  amount: alloc.apxAmount,
                  currency: 'APX',
                  usdEquivalent: alloc.usdAmount,
                  conversionRate: alloc.conversionRate,
                  note: `Daily ROI from ${inv.plan.name} — day ${dayNum} of ${inv.plan.durationDays}: $${alloc.usdAmount.toFixed(2)} → ${formatApx(alloc.apxAmount)} APX @ $${alloc.conversionRate}/APX`,
                },
              })

              await createNotification(
                inv.userId,
                'Daily APX Credited',
                `${formatApx(alloc.apxAmount)} APX ($${alloc.usdAmount.toFixed(2)}) from your ${inv.plan.name}.`,
                'success',
                '/dashboard/apx'
              )

              return { migrationEmailPayload: null, maturityOutcome: null }
            }
          }
        )

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
            `Your Starter Portfolio has completed both cycles. Migrate your $${inv.amount.toFixed(2)} locked capital to a higher plan.`,
            'info',
            '/dashboard/plans'
          )
        }

        investmentsDone++
        totalProfitPaid += alloc.usdAmount
        console.log(
          `[ROI Engine] ✅ ${inv.id} — ${inv.user.email} — ${formatApx(alloc.apxAmount)} APX ($${alloc.usdAmount}) — ${isMature ? 'MATURED' : 'daily'}`
        )
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
    console.log(
      `[ROI Engine] Done in ${duration}ms — ${investmentsDone}/${activeInvestments.length} — $${totalProfitPaid.toFixed(2)} paid as APX`
    )

    return NextResponse.json({
      success: true,
      investmentsFound: activeInvestments.length,
      investmentsDone,
      totalProfitPaid,
      apxEarningsRate: APX_EARNINGS_RATE,
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
