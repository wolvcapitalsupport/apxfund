import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcome } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json()

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.isEmailVerified) return NextResponse.json({ message: 'Already verified' })

  if (!user.emailVerifyOtp || user.emailVerifyOtp !== otp.trim()) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
  }

  if (!user.emailVerifyOtpExpiry || new Date() > user.emailVerifyOtpExpiry) {
    return NextResponse.json({ error: 'Code has expired. Please register again to get a new code.' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyOtp: null,
      emailVerifyOtpExpiry: null,
    },
  })

  // Send welcome email
  await sendWelcome(user.email, user.fullName)

  return NextResponse.json({ message: 'Email verified successfully' })
}

// Resend OTP
export async function PATCH(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.isEmailVerified) return NextResponse.json({ message: 'Already verified' })

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyOtp: otp, emailVerifyOtpExpiry: expiry },
  })

  const { sendVerificationOtp } = await import('@/lib/mailer')
  await sendVerificationOtp(user.email, user.fullName, otp)

  return NextResponse.json({ message: 'New code sent' })
}
