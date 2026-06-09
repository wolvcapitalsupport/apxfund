'use client'
import { useState, useEffect } from 'react'
import type { Lang } from './i18n'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const [lang, setLangState] = useState<Lang>('en')
  useEffect(() => {
    const cookie = getCookie('lang')
    if (cookie === 'de' || cookie === 'en') setLangState(cookie as Lang)
  }, [])
  const setLang = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 30}`
    setLangState(l)
  }
  return { lang, setLang }
}
