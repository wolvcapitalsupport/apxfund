import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const wallets = await prisma.walletAddress.findMany({
    where: { isActive: true },
    orderBy: { currency: 'asc' },
  })
  return NextResponse.json(wallets)
}
