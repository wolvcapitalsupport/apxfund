import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, phone, country, preferredLanguage } = await req.json()
  if (fullName !== undefined && !fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  if (preferredLanguage !== undefined && !['en', 'de'].includes(preferredLanguage)) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
      ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
      ...(country !== undefined ? { country: country?.trim() || null } : {}),
      ...(preferredLanguage ? { preferredLanguage } : {}),
    },
  })

  return NextResponse.json({ message: 'Profile updated', user: { fullName: updated.fullName } })
}
