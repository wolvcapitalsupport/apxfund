import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientKey, hashToken } from '@/lib/security'

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(getClientKey(req, 'reset-password'), 5, 15 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })

  try {
    const input = schema.parse(await req.json())
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(input.token) } })
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const password = await bcrypt.hash(input.password, 12)
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password } }),
      prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    ])
    return NextResponse.json({ message: 'Password updated successfully. You can now sign in.' })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}
