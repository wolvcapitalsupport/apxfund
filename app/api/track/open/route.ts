import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 1x1 transparent GIF in base64
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const trackingId = searchParams.get('id')

  if (trackingId) {
    try {
      const log = await (prisma as any).emailLog.findUnique({
        where: { trackingId },
        select: { id: true, openedAt: true, openCount: true },
      })

      if (log) {
        await (prisma as any).emailLog.update({
          where: { trackingId },
          data: {
            openedAt: log.openedAt ?? new Date(),
            openCount: { increment: 1 },
            lastOpenedAt: new Date(),
          },
        })
      }
    } catch {
      // silently fail — never block image delivery
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
