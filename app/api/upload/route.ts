import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
    const apiKey = process.env.CLOUDINARY_API_KEY!
    const apiSecret = process.env.CLOUDINARY_API_SECRET!

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const folder = 'apxfund'
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha256').update(toSign).digest('hex')

    const upload = new FormData()
    upload.append('file', file)
    upload.append('api_key', apiKey)
    upload.append('timestamp', timestamp)
    upload.append('signature', signature)
    upload.append('folder', folder)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: upload,
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.error?.message || 'Upload failed' }, { status: 400 })

    return NextResponse.json({ url: data.secure_url })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
