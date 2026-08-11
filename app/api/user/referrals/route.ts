import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [me, referredUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, referralCode: true },
    }),
    prisma.user.findMany({
      where: { referredBy: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        investments: {
          select: {
            id: true,
            amount: true,
            status: true,
            plan: { select: { referralBonus: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const referrals = referredUsers.map(user => {
    let earned = 0
    let pending = 0

    for (const inv of user.investments) {
      const bonus = (inv.amount * inv.plan.referralBonus) / 100
      if (inv.status === 'COMPLETED') earned += bonus
      if (inv.status === 'ACTIVE') pending += bonus
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      joinedAt: user.createdAt,
      status: user.investments.some(i => i.status === 'COMPLETED') ? 'EARNING' : 'NEW',
      earned,
      pending,
      investments: user.investments.length,
    }
  })

  const totals = referrals.reduce(
    (acc, ref) => {
      acc.earned += ref.earned
      acc.pending += ref.pending
      return acc
    },
    { earned: 0, pending: 0 }
  )

  const referralLink = `${process.env.NEXTAUTH_URL || 'https://apxfund.xyz'}/ref/${me.referralCode}`

  return NextResponse.json({
    referrals,
    totalReferrals: referrals.length,
    totalEarned: totals.earned,
    totalPending: totals.pending,
    referralLink,
  })
}
