'use client'

import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'
import { useLang } from '@/lib/useLang'
import type { Lang } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/user/me')
      .then(response => response.ok ? response.json() : null)
      .then(user => {
        if (user?.preferredLanguage === 'en' || user?.preferredLanguage === 'de') {
          setLang(user.preferredLanguage as Lang)
        }
      })
      .catch(() => {})
  }, [setLang])

  const changeLanguage = async (next: Lang) => {
    if (next === lang || saving) return
    setLang(next)
    setSaving(true)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: next }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-[#1e1e35] rounded-lg p-1" aria-label="Language">
      <Languages size={14} className="text-gray-500 mx-1" />
      {(['en', 'de'] as Lang[]).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => changeLanguage(option)}
          disabled={saving}
          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
            lang === option ? 'bg-[#c9a84c] text-[#0a0a14]' : 'text-gray-400 hover:text-white'
          }`}
          aria-pressed={lang === option}
        >
          {option === 'en' ? 'English' : 'Deutsch'}
        </button>
      ))}
    </div>
  )
}
