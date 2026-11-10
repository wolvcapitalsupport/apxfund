/**
 * POST /api/admin/migrate-profits-to-apx
 *
 * Migrates existing USD-denominated earnings (PROFIT + REFERRAL transactions
 * where currency IS NULL) into APX allocations at the fixed earnings rate.
 *
 * Capital returns (note contains "Capital returned") are excluded.
 * APX_REWARD and REFERRAL transactions already in APX (currency = 'APX') are excluded.
 *
 * GET  → dry run — shows exactly what would happen, no writes
 * POST → executes migration
 *
 * Safe to run once. Idempotent: already-migrated transactions are skipped
 * because they will have currency = 'APX' after migration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APX_EARNINGS_RATE, profitToApxAllocation } from '@/lib/apx'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

type UserMigration = {
  userId: string
  email: string
  fullName: string
  currentBalance: number
  eligibleUsdTransactions: number   // count of transactions being migrated
  eligibleUsd: number               // total USD earnings to convert
  apxAmount: number                 // resulting APX
  conversionRate: number
  balanceDeducted: number           // actual amount removed from balance (capped at balance)
  balanceShortfall: number          // earnings already withdrawn — APX still credited
}

async function buildMigrationPlan(): Promise<UserMigration[]> {
  // Fetch all USD-denominated earnings transactions (pre-APX system)
  // Excludes: currency = 'APX', type = DEPOSIT/WITHDRAWAL/ADJUSTMENT/APX_BUY/APX_REDEEM
  // Excludes: capital returns identified by note pattern
  const earningsTxs = await prisma.transaction.findMany({
    where: {
      type: { in: ['PROFIT', 'REFERRAL'] },
      OR: [
        { currency: 'USD' },
      ],
      NOT: {
        note: { contains: 'Capital returned' },
      },
    },
    include: {
      user: {
        select: { id: true, email: true, fullName: true, balance: true },
      },
    },
  })

  // Group by user
  type TxRow = (typeof earningsTxs)[0]
  type UserGroup = { user: TxRow['user']; txs: TxRow[] }
  const byUser: Record<string, UserGroup> = {}
  for (const tx of earningsTxs) {
    if (!byUser[tx.userId]) {
      byUser[tx.userId] = { user: tx.user, txs: [] }
    }
    byUser[tx.userId].txs.push(tx)
  }

  const plan: UserMigration[] = []

  for (const userId of Object.keys(byUser)) {
    const { user, txs } = byUser[userId]
    const eligibleUsd = parseFloat(txs.reduce((sum: number, tx: TxRow) => sum + tx.amount, 0).toFixed(2))
    if (eligibleUsd <= 0) continue

    const alloc = profitToApxAllocation(eligibleUsd, APX_EARNINGS_RATE)
    const balanceDeducted = parseFloat(Math.min(eligibleUsd, user.balance).toFixed(2))
    const balanceShortfall = parseFloat((eligibleUsd - balanceDeducted).toFixed(2))

    plan.push({
      userId,
      email: user.email,
      fullName: user.fullName,
      currentBalance: user.balance,
      eligibleUsdTransactions: txs.length,
      eligibleUsd,
      apxAmount: alloc.apxAmount,
      conversionRate: alloc.conversionRate,
      balanceDeducted,
      balanceShortfall,
    })
  }

  return plan
}

// GET — dry run
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const plan = await buildMigrationPlan()

  const totals = plan.reduce(
    (acc, u) => {
      acc.totalEligibleUsd += u.eligibleUsd
      acc.totalApx += u.apxAmount
      acc.totalBalanceDeducted += u.balanceDeducted
      acc.totalShortfall += u.balanceShortfall
      return acc
    },
    { totalEligibleUsd: 0, totalApx: 0, totalBalanceDeducted: 0, totalShortfall: 0 }
  )

  return NextResponse.json({
    dryRun: true,
    usersAffected: plan.length,
    totals,
    conversionRate: APX_EARNINGS_RATE,
    users: plan,
  })
}

// POST — intentionally blocked until an administrator supplies an explicit
// legacy reconciliation mapping. A blind user-level migration can convert the
// same ROI twice and can incorrectly debit a USD balance. Historical USD rows
// remain unchanged and are never treated as new APX maturity credits here.
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({
    error: 'Automatic legacy conversion is disabled. Review the GET dry-run, reconcile each investment’s legacyRoiPaidUsd explicitly, and preserve the historical USD rows before enabling a controlled payout.',
    dryRunOnly: true,
  }, { status: 409 })
}
