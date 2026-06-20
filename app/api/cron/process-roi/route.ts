import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { createNotification, Notifs } from '@/lib/notifications'
import { sendInvestmentMatured, sendPlanUpgradeNudge } from '@/lib/mailer'

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

        await prisma.$transaction(async (tx) => {
          if (isMature) {
            // Final day — credit last daily profit + return capital
            const totalCredit = inv.amount + dailyProfit

            await tx.investment.update({
              where: { id: inv.id },
              data: { status: 'COMPLETED', completedAt: now },
            })

            await tx.user.update({
              where: { id: inv.userId },
              data: {
                balance: { increment: totalCredit },
                totalProfit: { increment: dailyProfit },
              },
            })

            await tx.transaction.create({
              data: {
                userId: inv.userId,
                type: TransactionType.PROFIT,
                status: TransactionStatus.APPROVED,
                amount: dailyProfit,
                note: `Final daily ROI + capital returned from ${inv.plan.name}`,
              },
            })

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

            await sendInvestmentMatured(inv.user.email, inv.user.fullName, inv.plan.name, inv.amount, inv.expectedProfit)
            await createNotification(
              inv.userId,
              Notifs.profitCredited(inv.expectedProfit, inv.plan.name).title,
              Notifs.profitCredited(inv.expectedProfit, inv.plan.name).message,
              'success',
              '/dashboard'
            )
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
          }
        })

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
