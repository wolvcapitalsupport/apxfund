import { createHash, randomBytes } from 'crypto'

const buckets = new Map<string, { count: number; resetAt: number }>()

export function getClientKey(req: Request, scope: string) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = req.headers.get('x-real-ip')?.trim()
  return `${scope}:${forwarded || realIp || 'unknown'}`
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) }
  }
  current.count += 1
  if (current.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  }
  return { allowed: true, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) }
}

export function generateOtp() {
  return String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0')
}

export function generateSecureToken() {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function timingSafeTokenMatch(value: string, expectedHash: string) {
  return hashToken(value) === expectedHash
}
