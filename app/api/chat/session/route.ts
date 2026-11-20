import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLiveSession, newSessionToken, normalizePhone, validPhone } from '@/lib/chat'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token : null
    const existing = await getLiveSession(token)
    if (existing) return NextResponse.json({ session: { token: existing.token, visitorName: existing.visitorName, visitorPhone: existing.visitorPhone } })
    const name = typeof body.visitorName === 'string' ? body.visitorName.trim() : ''
    const phone = normalizePhone(typeof body.visitorPhone === 'string' ? body.visitorPhone : '')
    if (name.length < 2 || name.length > 100) return NextResponse.json({ error: 'Enter your name.' }, { status: 400 })
    if (!validPhone(phone)) return NextResponse.json({ error: 'Use an international WhatsApp number, for example +491234567890.' }, { status: 400 })
    if (body.consent !== true) return NextResponse.json({ error: 'Consent is required before starting chat.' }, { status: 400 })
    const session = await prisma.chatSession.create({ data: { token: newSessionToken(), visitorName: name, visitorPhone: phone, pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : null, consentAcceptedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } })
    return NextResponse.json({ session: { token: session.token, visitorName: session.visitorName, visitorPhone: session.visitorPhone } }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Unable to start chat.' }, { status: 500 }) }
}

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('x-chat-session-token')
  if (!token) return NextResponse.json({ error: 'Session required.' }, { status: 400 })
  const session = await prisma.chatSession.findUnique({ where: { token }, select: { id: true } })
  if (session) await prisma.chatSession.delete({ where: { id: session.id } })
  return NextResponse.json({ ok: true })
}
