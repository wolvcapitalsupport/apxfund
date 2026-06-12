import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/process-roi`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
