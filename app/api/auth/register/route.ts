import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationOtp } from '@/lib/mailer'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  country: z.string().optional(),
  referralCode: z.string().optional(),
})

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    let referredBy: string | undefined
    if (data.referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: data.referralCode },
      })
      if (referrer) {
        referredBy = referrer.id
      }
    }

    let newReferralCode = generateReferralCode()
    let codeExists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } })
    while (codeExists) {
      newReferralCode = generateReferralCode()
      codeExists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        referredBy,
        referralCode: newReferralCode,
        isActive: true,
        isEmailVerified: false,
        emailVerifyOtp: otp,
        emailVerifyOtpExpiry: otpExpiry,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    })

    await sendVerificationOtp(user.email, data.fullName, otp)

    return NextResponse.json({
      message: 'Account created. Please check your email for a verification code.',
      user,
      requiresVerification: true,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
