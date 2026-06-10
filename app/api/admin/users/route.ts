import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus } from '@prisma/client'
import { sendAccountSuspended, sendAccountReinstated } from '@/lib/mailer'
import { createNotification } from '@/lib/notifications'
import { addDays } from 'date-fns'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

// ── GET — list users with search + pagination ─────────────────────────
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { fullName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        balance: true,
        totalDeposited: true,
        totalProfit: true,
        totalWithdrawn: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
        _count: { select: { investments: true, transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total, page, limit })
}

// ── GET single user detail ────────────────────────────────────────────
// Called as /api/admin/users?userId=xxx&detail=true
export async function HEAD() {
  return NextResponse.json({})
}

// ── PATCH — all admin actions on a user ──────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId, action } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ── Toggle active/suspended ─────────────────────────────────────────
  if (action === 'toggleActive') {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    })

    await createNotification(
      userId,
      updated.isActive ? '✅ Account Reactivated' : '⚠️ Account Suspended',
      updated.isActive
        ? 'Your account has been reactivated. You can now access all platform features.'
        : 'Your account has been suspended. Please contact support for assistance.',
      updated.isActive ? 'success' : 'warning',
      '/dashboard'
    )

    return NextResponse.json({ message: `User ${updated.isActive ? 'activated' : 'suspended'}`, user: updated })
  }

  // ── Credit balance ──────────────────────────────────────────────────
  if (action === 'creditBalance') {
    const { amount, note } = body
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: amount },
          totalProfit: { increment: amount },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.PROFIT,
          status: TransactionStatus.APPROVED,
          amount,
          note: note || 'Admin credit',
        },
      }),
    ])

    await createNotification(
      userId,
      '💰 Balance Credited',
      `$${amount.toFixed(2)} has been credited to your account${note ? ` — ${note}` : ''}.`,
      'success',
      '/dashboard'
    )

    return NextResponse.json({ message: `$${amount} credited to ${user.fullName}`, balance: updated.balance })
  }

  // ── Debit balance ───────────────────────────────────────────────────
  if (action === 'debitBalance') {
    const { amount, note } = body
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    if (user.balance < amount) {
      return NextResponse.json({ error: `User only has $${user.balance.toFixed(2)} — cannot debit $${amount}` }, { status: 400 })
    }

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: amount },
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.APPROVED,
          amount,
          note: note || 'Admin debit',
        },
      }),
    ])

    await createNotification(
      userId,
      '⚠️ Balance Adjusted',
      `$${amount.toFixed(2)} has been debited from your account${note ? ` — ${note}` : ''}. Contact support if you have questions.`,
      'warning',
      '/dashboard'
    )

    return NextResponse.json({ message: `$${amount} debited from ${user.fullName}`, balance: updated.balance })
  }

  // ── Assign investment plan to user (admin-side purchase) ────────────
  if (action === 'assignInvestment') {
    const { planId, amount, bypassBalance } = body

    if (!planId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'planId and amount are required' }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 })
    }

    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return NextResponse.json(
        { error: `Amount must be between $${plan.minAmount} and $${plan.maxAmount} for this plan` },
        { status: 400 }
      )
    }

    // bypassBalance = admin can assign without user having enough balance
    // (admin is manually assigning, funds may have been deposited externally)
    if (!bypassBalance && user.balance < amount) {
      return NextResponse.json(
        { error: `User balance ($${user.balance.toFixed(2)}) is insufficient. Enable "bypass balance check" to proceed anyway.` },
        { status: 400 }
      )
    }

    const expectedProfit = (amount * plan.roiPercent) / 100
    const endDate = addDays(new Date(), plan.durationDays)

    const ops: any[] = [
      prisma.investment.create({
        data: {
          userId,
          planId: plan.id,
          amount,
          expectedProfit,
          endDate,
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.APPROVED,
          amount,
          note: `Admin-assigned investment — ${plan.name}`,
        },
      }),
    ]

    // Only deduct balance if not bypassing AND user has enough
    if (!bypassBalance) {
      ops.push(
        prisma.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } },
        })
      )
    } else {
      // Bypass: we still update totalDeposited for accounting
      ops.push(
        prisma.user.update({
          where: { id: userId },
          data: { totalDeposited: { increment: amount } },
        })
      )
    }

    const results = await prisma.$transaction(ops)
    const investment = results[0] as any

    await createNotification(
      userId,
      '🚀 Investment Activated',
      `An investment of $${amount.toFixed(2)} in the ${plan.name} has been activated on your account. Expected profit: $${expectedProfit.toFixed(2)} in ${plan.durationDays} day(s).`,
      'success',
      '/dashboard'
    )

    return NextResponse.json({
      message: `${plan.name} investment of $${amount} assigned to ${user.fullName}`,
      investment,
      expectedProfit,
      endDate,
    })
  }


  // ── Force approve KYC (admin bypass — no submission needed) ─────────
  if (action === 'forceKycApprove') {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'APPROVED' },
    })

    await createNotification(
      userId,
      '✅ KYC Verified',
      'Your identity has been verified by our compliance team. You now have full access to all platform features.',
      'success',
      '/dashboard'
    )

    return NextResponse.json({ message: `KYC force-approved for ${user.fullName}` })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}


// ── POST — create user manually ───────────────────────────────────────

// ── POST — create user manually ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, email, password, country, phone, kycStatus, role } = await req.json()

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'fullName, email and password are required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const bcrypt = await import('bcryptjs')
  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashed,
      fullName,
      country: country || null,
      phone: phone || null,
      kycStatus: kycStatus || 'NONE',
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      isActive: true,
    },
  })

  await import('@/lib/notifications').then(({ createNotification }) =>
    createNotification(
      user.id,
      '👋 Welcome to APXFund',
      'Your account has been created by our team. Complete KYC verification to unlock full access.',
      'info',
      '/dashboard/kyc'
    )
  )

  return NextResponse.json({ user: { id: user.id, email: user.email, fullName: user.fullName }, message: 'User created successfully' }, { status: 201 })
}
