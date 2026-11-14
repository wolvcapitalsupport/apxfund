import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordReset } from '@/lib/mailer'
import { checkRateLimit, generateSecureToken, getClientKey, hashToken } from '@/lib/security'

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(getClientKey(req, 'forgot-password'), 3, 15 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (user && user.isActive) {
    const rawToken = generateSecureToken()
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    })
    await sendPasswordReset(user.email, user.fullName, rawToken)
  }

  return NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' })
}
