'use client'
import { useEffect } from 'react'

export const TRACKING_CONSENT_KEY = 'apxfund_tracking_consent'

export default function TawkChat() {
  useEffect(() => {
    const load = () => {
      if (localStorage.getItem(TRACKING_CONSENT_KEY) !== 'accepted') return
      if (document.querySelector('script[data-apxfund-tawk]')) return
      ;(window as any).Tawk_API = (window as any).Tawk_API || {}
      ;(window as any).Tawk_LoadStart = new Date()
      const script = document.createElement('script')
      script.async = true
      script.dataset.apxfundTawk = 'true'
      script.src = 'https://embed.tawk.to/6a39a58b452f781d473b5022/1jroitarb'
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')
      document.head.appendChild(script)
    }
    load()
    window.addEventListener('apxfund:tracking-consent', load)
    return () => window.removeEventListener('apxfund:tracking-consent', load)
  }, [])
  return null
}
