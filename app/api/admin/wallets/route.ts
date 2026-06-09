import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const wallets = await prisma.walletAddress.findMany({ orderBy: { currency: 'asc' } })
  return NextResponse.json({ wallets })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, address, label, network, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updated = await prisma.walletAddress.update({
    where: { id },
    data: {
      ...(address !== undefined && { address }),
      ...(label !== undefined && { label }),
      ...(network !== undefined && { network }),
      ...(isActive !== undefined && { isActive }),
    },
  })
  return NextResponse.json({ wallet: updated, message: 'Wallet updated successfully' })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { currency, label, address, network } = await req.json()
  if (!currency || !label || !address)
    return NextResponse.json({ error: 'currency, label, and address are required' }, { status: 400 })
  const wallet = await prisma.walletAddress.create({
    data: { currency, label, address, network: network || 'mainnet' },
  })
  return NextResponse.json({ wallet, message: 'Wallet added' }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await prisma.walletAddress.delete({ where: { id } })
  return NextResponse.json({ message: 'Wallet deleted' })
}
