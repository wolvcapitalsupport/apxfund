import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const url = new URL(req.url)
  const code = params.code
  const redirectUrl = new URL(`/auth/register`, url.origin)
  redirectUrl.searchParams.set('ref', code)

  url.searchParams.forEach((value, key) => {
    if (key === 'ref') return
    redirectUrl.searchParams.set(key, value)
  })

  return NextResponse.redirect(redirectUrl)
}
