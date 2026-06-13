import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || '30'
  const days = range === '7' ? 7 : range === '30' ? 30 : 90

  const since = new Date()
  since.setDate(since.getDate() - days)

  const [transactions, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id, status: 'APPROVED' },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, createdAt: true },
    }),
  ])

  if (!user) return NextResponse.json([])

  // If no transactions return a flat line with current balance
  if (transactions.length === 0) {
    const points = []
    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      points.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: i === 0 ? user.balance : 0,
      })
    }
    return NextResponse.json(points.filter((_, i) => i === 0 || points[i].balance !== points[i-1].balance || i === points.length - 1))
  }

  // Build running balance day by day
  const txByDay: Record<string, number> = {}
  for (const tx of transactions) {
    const day = tx.createdAt.toISOString().split('T')[0]
    const delta = ['DEPOSIT', 'PROFIT', 'REFERRAL', 'ADJUSTMENT'].includes(tx.type)
      ? tx.amount : -tx.amount
    txByDay[day] = (txByDay[day] || 0) + delta
  }

  // Generate all days in range
  const points: { date: string; balance: number }[] = []
  let runningBalance = 0

  // Find starting balance (before range)
  const beforeRange = transactions.filter(tx => new Date(tx.createdAt) < since)
  for (const tx of beforeRange) {
    runningBalance += ['DEPOSIT', 'PROFIT', 'REFERRAL', 'ADJUSTMENT'].includes(tx.type) ? tx.amount : -tx.amount
  }

  for (let i = days; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (txByDay[key]) runningBalance += txByDay[key]
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: Math.max(0, runningBalance),
    })
  }

  // Always end with actual current balance
  if (points.length > 0) points[points.length - 1].balance = user.balance

  return NextResponse.json(points)
}
