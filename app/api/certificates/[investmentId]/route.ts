import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function fmtDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function GET(
  _req: Request,
  { params }: { params: { investmentId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const investment = await prisma.investment.findUnique({
    where: { id: params.investmentId },
    include: {
      user: { select: { id: true, fullName: true } },
      plan: { select: { name: true, roiPercent: true, durationDays: true } },
    },
  })

  if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 })

  const isOwner = investment.userId === session.user.id
  const isAdmin = session.user.role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (investment.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Certificate is available after maturity only' }, { status: 400 })
  }

  const certificateNumber = `APX-${investment.id.slice(-8).toUpperCase()}-${new Date(investment.completedAt || investment.endDate).getFullYear()}`
  const profit = investment.expectedProfit

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([900, 620])
  const width = page.getWidth()
  const height = page.getHeight()

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.04, 0.05, 0.1) })
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderWidth: 2, borderColor: rgb(0.79, 0.66, 0.3) })
  page.drawText('APXFund', { x: 60, y: height - 80, size: 34, font: fontBold, color: rgb(0.91, 0.8, 0.48) })
  page.drawText('Investment Maturity Certificate', { x: 60, y: height - 115, size: 18, font, color: rgb(0.9, 0.9, 0.9) })

  page.drawText('This certifies that', { x: 60, y: height - 190, size: 14, font, color: rgb(0.75, 0.75, 0.78) })
  page.drawText(investment.user.fullName, { x: 60, y: height - 222, size: 28, font: fontBold, color: rgb(1, 1, 1) })

  const lines = [
    ['Plan', investment.plan.name],
    ['Principal', `$${investment.amount.toFixed(2)}`],
    ['Profit Earned', `$${profit.toFixed(2)}`],
    ['ROI', `${investment.plan.roiPercent}%`],
    ['Cycle Start', fmtDate(investment.startDate)],
    ['Cycle End', fmtDate(investment.endDate)],
    ['Maturity Date', fmtDate(investment.completedAt || investment.endDate)],
    ['Certificate No.', certificateNumber],
  ]

  let y = height - 280
  for (const [label, value] of lines) {
    page.drawText(`${label}:`, { x: 60, y, size: 13, font: fontBold, color: rgb(0.82, 0.82, 0.84) })
    page.drawText(value, { x: 220, y, size: 13, font, color: rgb(1, 1, 1) })
    y -= 28
  }

  page.drawText('Authorized by APXFund Operations', {
    x: 60,
    y: 80,
    size: 12,
    font,
    color: rgb(0.75, 0.75, 0.78),
  })

  page.drawText('Digital Certificate', {
    x: width - 220,
    y: 70,
    size: 20,
    font: fontBold,
    color: rgb(0.79, 0.66, 0.3),
  })

  const bytes = await pdf.save()

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="apxfund-certificate-${investment.id.slice(-6)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
