import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionStatus, TransactionType } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import { sendInvestmentMatured } from '@/lib/mailer'
import { APX_EARNINGS_RATE, formatApx, profitToApxAllocation } from '@/lib/apx'

function money(value: number) {
  return Number(value.toFixed(2))
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let investmentsDone = 0
  let totalProfitPaid = 0
  let totalApxPaid = 0
  let totalUsdPrincipalReturned = 0
  const errors: string[] = []

  const candidates = await prisma.investment.findMany({
    where: { status: 'ACTIVE', endDate: { lte: now }, isPaused: false, legacyRoiReviewRequired: false },
    select: { id: true },
  })

  for (const candidate of candidates) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // This conditional claim is the compare-and-swap guard. If cron and
        // admin processing overlap, only one transaction can claim the ACTIVE row.
        const claimed = await tx.investment.updateMany({
          where: {
            id: candidate.id,
            status: 'ACTIVE',
            endDate: { lte: now },
            isPaused: false,
            legacyRoiReviewRequired: false,
          },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            maturityProcessedAt: now,
            lastRoiProcessedAt: now,
          },
        })
        if (claimed.count !== 1) return null

        const inv = await tx.investment.findUnique({
          where: { id: candidate.id },
          include: { plan: true, user: true },
        })
        if (!inv) throw new Error('Investment disappeared after claim')

        // legacyRoiPaidUsd is populated only by an explicit reconciliation;
        // never silently convert an already-paid portion a second time.
        const outstandingRoiUsd = money(Math.max(0, inv.expectedProfit - inv.legacyRoiPaidUsd - inv.roiPaidUsd))
        const alloc = profitToApxAllocation(outstandingRoiUsd, APX_EARNINGS_RATE)

        await tx.user.update({
          where: { id: inv.userId },
          data: {
            balance: { increment: inv.amount },
            ...(alloc.apxAmount > 0
              ? {
                  apxBalance: { increment: alloc.apxAmount },
                  apxRewards: { increment: alloc.apxAmount },
                }
              : {}),
            totalProfit: { increment: outstandingRoiUsd },
          },
        })

        await tx.transaction.create({
          data: {
            userId: inv.userId,
            investmentId: inv.id,
            type: TransactionType.PROFIT,
            status: TransactionStatus.APPROVED,
            amount: inv.amount,
            currency: 'USD',
            note: `Investment maturity principal returned to USD balance — ${inv.plan.name}`,
          },
        })

        if (alloc.apxAmount > 0) {
          await tx.transaction.create({
            data: {
              userId: inv.userId,
              investmentId: inv.id,
              type: TransactionType.APX_REWARD,
              status: TransactionStatus.APPROVED,
              amount: alloc.apxAmount,
              currency: 'APX',
              usdEquivalent: alloc.usdAmount,
              conversionRate: alloc.conversionRate,
              note: `Maturity ROI credited to internal APX ledger only: $${alloc.usdAmount.toFixed(2)} ROI basis → ${formatApx(alloc.apxAmount)} APX @ $${alloc.conversionRate}/APX; no on-chain transfer`,
            },
          })
        }

        await tx.investment.update({
          where: { id: inv.id },
          data: {
            roiPaidUsd: { increment: outstandingRoiUsd },
            roiPaidApx: { increment: alloc.apxAmount },
            principalReturnedUsd: { increment: inv.amount },
            autoReinvest: false,
          },
        })

        // Existing referral behavior is preserved, but the referral reward is
        // also an internal APX ledger credit rather than a USD balance credit.
        let referral: { userId: string; apxAmount: number; usdAmount: number; name: string } | null = null
        if (inv.user.referredBy) {
          const referralUsd = money((inv.amount * inv.plan.referralBonus) / 100)
          const referralAlloc = profitToApxAllocation(referralUsd, APX_EARNINGS_RATE)
          const referrer = await tx.user.findUnique({ where: { id: inv.user.referredBy }, select: { id: true, isActive: true } })
          if (referrer?.isActive && referralAlloc.apxAmount > 0) {
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
                note: `Referral bonus credited to internal APX ledger only from ${inv.user.fullName}'s ${inv.plan.name}: $${referralAlloc.usdAmount.toFixed(2)} → ${formatApx(referralAlloc.apxAmount)} APX`,
              },
            })
            referral = { userId: referrer.id, apxAmount: referralAlloc.apxAmount, usdAmount: referralAlloc.usdAmount, name: inv.user.fullName }
          }
        }

        return {
          userId: inv.userId,
          email: inv.user.email,
          fullName: inv.user.fullName,
          planName: inv.plan.name,
          principal: inv.amount,
          roiUsd: outstandingRoiUsd,
          apxAmount: alloc.apxAmount,
          referral,
        }
      })

      if (!result) continue
      investmentsDone++
      totalProfitPaid += result.roiUsd
      totalApxPaid += result.apxAmount
      totalUsdPrincipalReturned += result.principal

      await createNotification(
        result.userId,
        'Investment Matured — Principal Returned in USD',
        `$${result.principal.toFixed(2)} principal returned to your USD balance. ${formatApx(result.apxAmount)} APX credited to your internal APX ledger for $${result.roiUsd.toFixed(2)} ROI. No on-chain transfer was made.`,
        'success',
        '/dashboard/transactions'
      )
      await sendInvestmentMatured(result.email, result.fullName, result.planName, result.principal, result.roiUsd, result.apxAmount)

      if (result.referral) {
        await createNotification(
          result.referral.userId,
          'Referral Bonus — APX Credited',
          `${formatApx(result.referral.apxAmount)} APX credited to your internal APX ledger from ${result.referral.name}'s maturity. No on-chain transfer was made.`,
          'success',
          '/dashboard/apx'
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Investment ${candidate.id}: ${message}`)
      console.error(`[ROI Engine] ${candidate.id}:`, error)
    }
  }

  await prisma.roiProcessingLog.create({
    data: {
      investmentsFound: candidates.length,
      investmentsDone,
      totalProfitPaid: money(totalProfitPaid),
      totalApxPaid,
      totalUsdPrincipalReturned: money(totalUsdPrincipalReturned),
      errors: errors.length ? errors.join('; ') : undefined,
    },
  })

  return NextResponse.json({
    success: true,
    investmentsFound: candidates.length,
    investmentsDone,
    totalProfitPaid: money(totalProfitPaid),
    totalApxPaid,
    totalUsdPrincipalReturned: money(totalUsdPrincipalReturned),
    apxEarningsRate: APX_EARNINGS_RATE,
    errors: errors.length ? errors : undefined,
  })
}
