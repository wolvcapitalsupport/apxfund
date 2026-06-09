import { NextRequest, NextResponse } from 'next/server'

const GERMAN_COUNTRIES = new Set(['DE', 'AT', 'CH'])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = ['/', '/investment-plans', '/about', '/our-team', '/policies', '/auth'].some(
    p => pathname === p || pathname.startsWith(p + '/')
  )
  if (!isPublic) return NextResponse.next()
  if (req.cookies.get('lang')?.value) return NextResponse.next()

  const country = req.headers.get('x-vercel-ip-country') || ''
  const lang = GERMAN_COUNTRIES.has(country.toUpperCase()) ? 'de' : 'en'
  const response = NextResponse.next()
  response.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  return response
}

export const config = {
  matcher: ['/((?!api|_next|fonts|public|favicon.ico).*)'],
}
