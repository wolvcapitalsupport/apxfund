import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'

  const where = status === 'ALL' ? {} : { status: status as any }

  const requests = await prisma.apxRedemption.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ requests })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { redemptionId, action, adminNote } = await req.json()

  if (!redemptionId || !['approve', 'reject', 'settle'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const row = await prisma.apxRedemption.findUnique({ where: { id: redemptionId } })
  if (!row) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  if (action === 'approve') {
    if (row.status !== 'PENDING') return NextResponse.json({ error: 'Only pending requests can be approved' }, { status: 400 })

    // Auto-settle on approval — credits USD balance immediately.
    // Admin approves once; no separate settle step required.
    const now = new Date()
    await prisma.$transaction([
      prisma.apxRedemption.update({
        where: { id: row.id },
        data: {
          status: 'SETTLED',
          reviewedAt: now,
          settledAt: now,
          adminNote: adminNote || null,
        },
      }),
      prisma.user.update({
        where: { id: row.userId },
        data: {
          balance: { increment: row.usdValue },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: row.userId,
          type: 'APX_REDEEM',
          status: 'APPROVED',
          amount: row.usdValue,
          currency: 'USD',
          note: `APX redeemed: ${row.amount.toFixed(2)} APX → $${row.usdValue.toFixed(2)} USD @ $${row.rateUsd}/APX`,
        },
      }),
    ])

    await createNotification(
      row.userId,
      'APX Redeemed — USD Credited',
      `${row.amount.toFixed(2)} APX redeemed. $${row.usdValue.toFixed(2)} has been credited to your USD balance and is ready to withdraw.`,
      'success',
      '/dashboard'
    )

    return NextResponse.json({ message: 'Redemption approved and USD credited to balance' })
  }

  if (action === 'reject') {
    if (row.status !== 'PENDING' && row.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Only pending/approved requests can be rejected' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.apxRedemption.update({
        where: { id: row.id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          adminNote: adminNote || null,
        },
      }),
      prisma.user.update({
        where: { id: row.userId },
        data: {
          apxBalance: { increment: row.amount },
        },
      }),
    ])

    await createNotification(
      row.userId,
      'APX Redemption Rejected',
      `Your APX redemption was rejected. ${row.amount.toFixed(2)} APX has been returned to your APX wallet.`,
      'error',
      '/dashboard/apx'
    )

    return NextResponse.json({ message: 'Redemption rejected and APX refunded' })
  }

  if (row.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Only approved requests can be settled' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.apxRedemption.update({
      where: { id: row.id },
      data: {
        status: 'SETTLED',
        settledAt: new Date(),
        adminNote: adminNote || null,
      },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: {
        balance: { increment: row.usdValue },
      },
    }),
    prisma.transaction.create({
      data: {
        userId: row.userId,
        type: 'APX_REDEEM',
        status: 'APPROVED',
        amount: row.usdValue,
        currency: 'USD',
        note: `APX redemption settled: ${row.amount.toFixed(2)} APX`,
      },
    }),
  ])

  await createNotification(
    row.userId,
    'APX Redemption Settled',
    `Your APX redemption has been settled and $${row.usdValue.toFixed(2)} was credited to your USD balance.`,
    'success',
    '/dashboard'
  )

  return NextResponse.json({ message: 'Redemption settled and USD credited' })
}