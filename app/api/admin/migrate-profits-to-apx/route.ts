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
import { APX_EARNINGS_RATE, profitToApxAllocation, formatApx } from '@/lib/apx'

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
        { currency: null },
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

// POST — execute
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  if (body.confirm !== true) {
    return NextResponse.json(
      { error: 'Send { "confirm": true } to execute. Run GET first to preview.' },
      { status: 400 }
    )
  }

  const plan = await buildMigrationPlan()
  if (plan.length === 0) {
    return NextResponse.json({ message: 'No eligible transactions found — nothing to migrate.' })
  }

  const results: Array<{ userId: string; email: string; status: 'ok' | 'error'; error?: string }> = []

  for (const user of plan) {
    try {
      // Fetch the actual transaction IDs to mark as migrated
      const txIds = await prisma.transaction.findMany({
        where: {
          userId: user.userId,
          type: { in: ['PROFIT', 'REFERRAL'] },
          OR: [{ currency: null }, { currency: 'USD' }],
          NOT: { note: { contains: 'Capital returned' } },
        },
        select: { id: true, note: true },
      })

      await prisma.$transaction([
        // Deduct from USD balance (floor at 0)
        prisma.user.update({
          where: { id: user.userId },
          data: {
            balance: { decrement: user.balanceDeducted },
            apxBalance: { increment: user.apxAmount },
            apxRewards: { increment: user.apxAmount },
          },
        }),

        // Create single migration APX_REWARD record with full accounting
        prisma.transaction.create({
          data: {
            userId: user.userId,
            type: 'APX_REWARD',
            status: 'APPROVED',
            amount: user.apxAmount,
            currency: 'APX',
            usdEquivalent: user.eligibleUsd,
            conversionRate: user.conversionRate,
            note: `Migration: $${user.eligibleUsd.toFixed(2)} historical earnings → ${formatApx(user.apxAmount)} APX @ $${user.conversionRate}/APX (${user.eligibleUsdTransactions} transactions converted${user.balanceShortfall > 0 ? `; $${user.balanceShortfall.toFixed(2)} already withdrawn before migration` : ''})`,
          },
        }),

        // Stamp original transactions so they're skipped on re-run
        ...txIds.map((tx) =>
          prisma.transaction.update({
            where: { id: tx.id },
            data: {
              currency: 'USD',
              note: (tx.note ?? '') + ' [migrated-to-apx]',
            },
          })
        ),
      ])

      results.push({ userId: user.userId, email: user.email, status: 'ok' })
    } catch (err: any) {
      results.push({ userId: user.userId, email: user.email, status: 'error', error: err.message })
    }
  }

  const succeeded = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status === 'error').length

  return NextResponse.json({
    message: `Migration complete — ${succeeded} users migrated, ${failed} failed.`,
    results,
  })
}