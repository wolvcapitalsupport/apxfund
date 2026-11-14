import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientKey } from '@/lib/security'
import { createTotpEnrollment, encryptTotpSecret, verifyTotpToken } from '@/lib/totp'

const code = z.string().regex(/^\d{6}$/, 'Enter the 6-digit authenticator code')

async function currentUser(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, fullName: true, password: true, twoFactorEnabled: true, twoFactorSecret: true } })
}

export async function GET(req: NextRequest) {
  const user = await currentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ enabled: user.twoFactorEnabled, setupPending: Boolean(user.twoFactorSecret && !user.twoFactorEnabled) })
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(getClientKey(req, 'user-2fa'), 10, 15 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many security attempts. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })
  const user = await currentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const action = body.action
    if (action === 'setup') {
      if (user.twoFactorEnabled) return NextResponse.json({ error: 'Two-factor authentication is already enabled.' }, { status: 400 })
      const enrollment = createTotpEnrollment(user.email)
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: encryptTotpSecret(enrollment.secret), twoFactorEnabled: false } })
      return NextResponse.json({ uri: enrollment.uri, qrDataUrl: await QRCode.toDataURL(enrollment.uri), secret: enrollment.secret })
    }

    if (action === 'enable') {
      const token = code.parse(body.token)
      if (!user.twoFactorSecret) return NextResponse.json({ error: 'Start setup before enabling 2FA.' }, { status: 400 })
      if (!(await verifyTotpToken(user.twoFactorSecret, token))) return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 })
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
      return NextResponse.json({ enabled: true, message: 'Two-factor authentication enabled.' })
    }

    if (action === 'disable') {
      const token = code.parse(body.token)
      const password = z.string().min(1).parse(body.password)
      if (!user.twoFactorEnabled || !user.twoFactorSecret) return NextResponse.json({ error: 'Two-factor authentication is not enabled.' }, { status: 400 })
      if (!(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      if (!(await verifyTotpToken(user.twoFactorSecret, token))) return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 })
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
      return NextResponse.json({ enabled: false, message: 'Two-factor authentication disabled.' })
    }

    return NextResponse.json({ error: 'Unsupported 2FA action.' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('User 2FA error:', error)
    return NextResponse.json({ error: 'Unable to update two-factor authentication.' }, { status: 500 })
  }
}
