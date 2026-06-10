import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification, Notifs } from '@/lib/notifications'
import { sendKycApproved, sendKycRejected } from '@/lib/mailer'

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
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20

  const where: any = {}
  if (status !== 'ALL') where.status = status

  const [submissions, total] = await Promise.all([
    prisma.kycSubmission.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, kycStatus: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.kycSubmission.count({ where }),
  ])

  return NextResponse.json({ submissions, total, page, limit })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { submissionId, action, adminNote } = await req.json()

  if (!submissionId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const submission = await prisma.kycSubmission.findUnique({
    where: { id: submissionId },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  })

  if (!submission) return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 })
  if (submission.status !== 'PENDING') {
    return NextResponse.json({ error: 'KYC already reviewed' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
  const userKycStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

  await prisma.$transaction([
    prisma.kycSubmission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: submission.userId },
      data: { kycStatus: userKycStatus },
    }),
  ])

  if (action === 'approve') {
    await createNotification(
      submission.userId,
      Notifs.kycApproved().title,
      Notifs.kycApproved().message,
      'success',
      '/dashboard'
    )
    await sendKycApproved(submission.user.email, submission.user.fullName)
    return NextResponse.json({ message: 'KYC approved' })
  } else {
    await createNotification(
      submission.userId,
      Notifs.kycRejected(adminNote).title,
      Notifs.kycRejected(adminNote).message,
      'error',
      '/dashboard/kyc'
    )
    await sendKycRejected(submission.user.email, submission.user.fullName, adminNote)
    return NextResponse.json({ message: 'KYC rejected' })
  }
}
