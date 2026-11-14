import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { generateSecret, generateURI, verify } from 'otplib'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12

function encryptionKey() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for 2FA')
  return createHash('sha256').update(secret).digest()
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}

export function decryptTotpSecret(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split('.')
  if (!ivPart || !tagPart || !encryptedPart) throw new Error('Invalid encrypted TOTP secret')
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivPart, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedPart, 'base64url')), decipher.final()]).toString('utf8')
}

export function createTotpEnrollment(email: string) {
  const secret = generateSecret()
  return { secret, uri: generateURI({ issuer: 'APXFund', label: email, secret }) }
}

export async function verifyTotpToken(encryptedSecret: string, token: string) {
  try {
    const secret = decryptTotpSecret(encryptedSecret)
    const result = await verify({ secret, token: token.replace(/\s/g, '') })
    return result.valid === true
  } catch {
    return false
  }
}
