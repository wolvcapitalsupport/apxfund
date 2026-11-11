import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LOCALE, isSupportedLocale, localeFromCountry, localeFromLanguageTag, type SupportedLocale } from '@/lib/locale'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function detectLocale(req: NextRequest): SupportedLocale {
  const country = req.headers.get('x-vercel-ip-country')
    || req.headers.get('cf-ipcountry')
    || req.headers.get('cloudfront-viewer-country')
  const countryLocale = localeFromCountry(country)
  if (countryLocale) return countryLocale

  const accepted = req.headers.get('accept-language')?.split(',') || []
  for (const language of accepted) {
    const locale = localeFromLanguageTag(language.split(';')[0]?.trim())
    if (locale) return locale
  }

  return DEFAULT_LOCALE
}

export function middleware(req: NextRequest) {
  const saved = req.cookies.get('lang')?.value
  if (isSupportedLocale(saved)) return NextResponse.next()

  const lang = detectLocale(req)
  const response = NextResponse.next()
  response.cookies.set('lang', lang, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  return response
}

export const config = {
  matcher: ['/((?!api|_next|fonts|public|favicon.ico).*)'],
}
