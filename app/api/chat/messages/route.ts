import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLiveSession, MAX_MESSAGE_LENGTH } from '@/lib/chat'
import { sendWhatsAppTemplate, sendWhatsAppText } from '@/lib/whatsapp'

function token(request: NextRequest, body?: any) { return request.headers.get('x-chat-session-token') || (typeof body?.token === 'string' ? body.token : null) }

export async function GET(request: NextRequest) {
  const session = await getLiveSession(token(request))
  if (!session) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
  const messages = await prisma.chatMessage.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: 'asc' }, select: { id: true, sender: true, body: true, createdAt: true } })
  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const session = await getLiveSession(token(request, body))
  if (!session) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text || text.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 })
  const message = await prisma.chatMessage.create({ data: { sessionId: session.id, sender: 'VISITOR', body: text } })
  try {
    let result
    try { result = await sendWhatsAppText(process.env.ADMIN_WHATSAPP_NUMBER!, `[${session.visitorName} · ${session.visitorPhone}]\n${text}`) }
    catch (error) {
      if (!process.env.WHATSAPP_ALERT_TEMPLATE_NAME) throw error
      result = await sendWhatsAppTemplate(process.env.ADMIN_WHATSAPP_NUMBER!, process.env.WHATSAPP_ALERT_TEMPLATE_NAME)
    }
    const wamid = result.messages?.[0]?.id
    if (wamid) await prisma.chatMessage.update({ where: { id: message.id }, data: { wamid } })
    return NextResponse.json({ ok: true, message: { id: message.id, sender: message.sender, body: message.body, createdAt: message.createdAt } }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Message saved but could not be forwarded.' }, { status: 502 }) }
}
