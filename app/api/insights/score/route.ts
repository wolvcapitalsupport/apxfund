import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { subDays } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildSnapshot, computeScore } from '@/lib/insights'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = subDays(new Date(), 7)
  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        totalProfit: true,
        totalDeposited: true,
        totalWithdrawn: true,
        apxBalance: true,
        apxRewards: true,
        investments: { select: { status: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, createdAt: { gte: since } },
      select: { type: true, status: true, amount: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const snapshot = buildSnapshot(user, transactions)
  const score = computeScore(snapshot)

  return NextResponse.json({ score, snapshot })
}
