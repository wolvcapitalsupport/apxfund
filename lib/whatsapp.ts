import crypto from 'crypto'

const graphVersion = process.env.GRAPH_API_VERSION || 'v21.0'
const graphBase = `https://graph.facebook.com/${graphVersion}`

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export async function sendWhatsAppText(to: string, body: string) {
  return sendWhatsAppPayload({ messaging_product: 'whatsapp', to, type: 'text', text: { body, preview_url: false } })
}

export async function sendWhatsAppTemplate(to: string, name: string, languageCode = 'en_US') {
  return sendWhatsAppPayload({ messaging_product: 'whatsapp', to, type: 'template', template: { name, language: { code: languageCode } } })
}

async function sendWhatsAppPayload(payload: Record<string, unknown>) {
  const response = await fetch(`${graphBase}/${required('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${required('WHATSAPP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store',
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`WhatsApp API error ${response.status}: ${JSON.stringify(json)}`)
  return json as { messages?: Array<{ id?: string }> }
}

export function verifyWhatsAppSignature(rawBody: string, signature: string | null) {
  if (!signature?.startsWith('sha256=') || !process.env.META_APP_SECRET) return false
  const expected = `sha256=${crypto.createHmac('sha256', process.env.META_APP_SECRET).update(rawBody).digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export const ADMIN_REMINDER = 'Reply not delivered—please use Swipe-to-Reply on a specific visitor message so the system knows which chat to route it to.'
