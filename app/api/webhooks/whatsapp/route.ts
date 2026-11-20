import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ADMIN_REMINDER, sendWhatsAppText, verifyWhatsAppSignature } from '@/lib/whatsapp'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams
  if (query.get('hub.verify_token') !== process.env.WHATSAPP_VERIFY_TOKEN) return new NextResponse('Forbidden', { status: 403 })
  return new NextResponse(query.get('hub.challenge') || '', { status: 200 })
}

export async function POST(request: NextRequest) {
  const raw = await request.text()
  if (!verifyWhatsAppSignature(raw, request.headers.get('x-hub-signature-256'))) return new NextResponse('Invalid signature', { status: 401 })
  const payload = JSON.parse(raw)
  const messages = payload?.entry?.flatMap((entry: any) => entry.changes?.flatMap((change: any) => change.value?.messages || []) || []) || []
  for (const incoming of messages) {
    const wamid = incoming.id
    const text = incoming.text?.body
    if (!wamid || !text) continue
    const duplicate = await prisma.chatMessage.findUnique({ where: { wamid }, select: { id: true } })
    if (duplicate) continue
    const contextWamid = incoming.context?.id || null
    const original = contextWamid ? await prisma.chatMessage.findUnique({ where: { wamid: contextWamid }, select: { sessionId: true } }) : null
    if (!original) {
      await prisma.unroutedAdminMessage.create({ data: { wamid, from: incoming.from || 'unknown', body: text, contextWamid } }).catch(() => undefined)
      if (process.env.ADMIN_WHATSAPP_NUMBER) await sendWhatsAppText(process.env.ADMIN_WHATSAPP_NUMBER, ADMIN_REMINDER).catch(() => undefined)
      continue
    }
    await prisma.chatMessage.create({ data: { sessionId: original.sessionId, sender: 'ADMIN', body: text, wamid } })
  }
  return NextResponse.json({ ok: true })
}
