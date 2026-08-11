import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { subDays } from 'date-fns'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInsight } from '@/lib/aiProvider'
import { buildSnapshot, computeScore, deterministicAction } from '@/lib/insights'

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
        investments: {
          select: { status: true },
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: since },
      },
      select: {
        type: true,
        status: true,
        amount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const snapshot = buildSnapshot(user, transactions)
  const score = computeScore(snapshot)
  const fallbackAction = deterministicAction(snapshot)

  const actionPrompt = [
    'Generate a single best action for this investor today.',
    'Constraints: max 20 words, direct and practical, no hype, no guarantee.',
    `Snapshot: ${JSON.stringify(snapshot)}`,
  ].join('\n')

  const briefPrompt = [
    'Write a weekly portfolio brief in 2 short sentences.',
    'Sentence 1: what improved this week using the numbers.',
    'Sentence 2: what to do next week in plain language.',
    `Snapshot: ${JSON.stringify(snapshot)}`,
  ].join('\n')

  const [action, brief] = await Promise.all([
    generateInsight({
      system: 'You are a conservative fintech growth coach.',
      user: actionPrompt,
      fallback: fallbackAction,
    }),
    generateInsight({
      system: 'You write concise portfolio briefings grounded in user data.',
      user: briefPrompt,
      fallback: `This week delivered $${snapshot.weeklyProfit.toFixed(2)} in profit. Next week, maintain at least one active cycle and avoid interrupting compounding unnecessarily.`,
    }),
  ])

  return NextResponse.json({
    score,
    action: action.message,
    brief: brief.message,
    provider: {
      action: action.source,
      brief: brief.source,
    },
    snapshot,
  })
}
