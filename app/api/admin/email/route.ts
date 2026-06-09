import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.EMAIL_FROM || 'APXFund <noreply@apxfund.xyz>'
const BASE_URL = process.env.NEXTAUTH_URL || 'https://apxfund.xyz'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const [logs, total] = await Promise.all([
    (prisma as any).emailLog.findMany({
      orderBy: { sentAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).emailLog.count(),
  ])
  return NextResponse.json({ logs, total })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { recipientType, userIds, customEmails, subject, bodyHtml } = await req.json()
  if (!subject || !bodyHtml)
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })

  let recipients: string[] = []
  if (recipientType === 'all') {
    const users = await prisma.user.findMany({ where: { isActive: true, role: 'USER' }, select: { email: true } })
    recipients = users.map(u => u.email)
  } else if (recipientType === 'selected' && Array.isArray(userIds) && userIds.length > 0) {
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { email: true } })
    recipients = users.map(u => u.email)
  } else if (recipientType === 'custom' && Array.isArray(customEmails) && customEmails.length > 0) {
    recipients = customEmails.filter((e: string) => e.includes('@'))
  } else {
    return NextResponse.json({ error: 'No valid recipients specified' }, { status: 400 })
  }

  if (recipients.length === 0)
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 })

  const log = await (prisma as any).emailLog.create({
    data: { sentBy: session.user.id, recipients, subject, bodyHtml },
  })

  const trackingPixel = `<img src="${BASE_URL}/api/track/open?id=${log.trackingId}" width="1" height="1" style="display:none" alt="" />`
  const trackedBody = bodyHtml + trackingPixel

  let sentCount = 0
  const errors: string[] = []
  for (const email of recipients) {
    try {
      await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html: trackedBody })
      sentCount++
    } catch (err: any) {
      errors.push(`${email}: ${err.message}`)
    }
  }

  return NextResponse.json({
    message: `Email sent to ${sentCount} of ${recipients.length} recipient(s)`,
    logId: log.id,
    sentCount,
    ...(errors.length > 0 && { errors }),
  })
}
