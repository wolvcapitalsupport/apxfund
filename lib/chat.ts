import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const SESSION_COOKIE = 'apxfund_chat_token'
export const MAX_MESSAGE_LENGTH = 2000

export function newSessionToken() { return crypto.randomBytes(32).toString('hex') }
export function normalizePhone(value: string) { return value.trim().replace(/[\s().-]/g, '') }
export function validPhone(value: string) { return /^\+[1-9]\d{7,14}$/.test(value) }

export async function getLiveSession(token: string | null) {
  if (!token) return null
  const session = await prisma.chatSession.findUnique({ where: { token } })
  if (!session) return null
  if (session.expiresAt <= new Date()) {
    await prisma.chatSession.delete({ where: { id: session.id } }).catch(() => undefined)
    return null
  }
  return session
}
