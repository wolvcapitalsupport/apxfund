export type SupportedLocale = 'en' | 'de'

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'en' || value === 'de'
}

export function localeFromLanguageTag(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null
  return value.toLowerCase().startsWith('de') ? 'de' : value.toLowerCase().startsWith('en') ? 'en' : null
}

export function localeFromCountry(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null
  return ['AT', 'CH', 'DE', 'LI'].includes(value.toUpperCase()) ? 'de' : null
}
