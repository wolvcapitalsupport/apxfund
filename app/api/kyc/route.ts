import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification, Notifs } from '@/lib/notifications'
import { z } from 'zod'

// This prevents the "Failed to collect page data" build error
export const dynamic = 'force-dynamic';

const kycSchema = z.object({
  documentType: z.enum(['passport', 'national_id', 'drivers_license']),
  documentNumber: z.string().min(3, 'Document number is required'),
  frontImageUrl: z.string().url('Front image URL required'),
  backImageUrl: z.string().url().optional(),
  selfieUrl: z.string().url('Selfie URL required'),
})

// GET — get user's current KYC submission
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch submission and user status in parallel for better performance
    const [submission, user] = await Promise.all([
      prisma.kycSubmission.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { kycStatus: true, kycRejectedNote: true },
      })
    ])

    return NextResponse.json({ 
      submission, 
      kycStatus: user?.kycStatus, 
      kycRejectedNote: user?.kycRejectedNote 
    })
  } catch (error) {
    console.error('KYC fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST — submit KYC documents
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = kycSchema.parse(body)

    // Check if user already has a pending or approved KYC
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true },
    })

    if (user?.kycStatus === 'APPROVED') {
      return NextResponse.json({ error: 'Your KYC is already approved' }, { status: 400 })
    }
    if (user?.kycStatus === 'PENDING') {
      return NextResponse.json({ error: 'You already have a pending KYC submission' }, { status: 400 })
    }

    // Create submission + update user kyc status atomically
    const [submission] = await prisma.$transaction([
      prisma.kycSubmission.create({
        data: {
          userId: session.user.id,
          ...data,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          kycStatus: 'PENDING',
          kycRejectedNote: null,
        },
      }),
    ])

    // Notify user
    await createNotification(
      session.user.id,
      Notifs.kycPending().title,
      Notifs.kycPending().message,
      'info',
      '/dashboard/kyc'
    )

    return NextResponse.json({ message: 'KYC submitted successfully', submission }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('KYC submit error:', error)
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 })
  }
}