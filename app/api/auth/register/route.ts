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
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Validate referral code if provided
    let referredBy: string | undefined
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode },
      })
      if (!referrer) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
      }
      referredBy = referrer.id
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        referredBy,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
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

    // Send verification OTP — non-blocking
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
