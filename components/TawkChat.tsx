'use client'
import { useEffect } from 'react'

export default function TawkChat() {
  useEffect(() => {
    const existing = document.querySelectorAll('script[src*="tawk.to"]')
    existing.forEach(s => s.remove())

    const Tawk_API = (window as any).Tawk_API || {}
    const Tawk_LoadStart = new Date();
    (window as any).Tawk_API = Tawk_API;
    (window as any).Tawk_LoadStart = Tawk_LoadStart

    const s1 = document.createElement('script')
    const s0 = document.getElementsByTagName('script')[0]
    s1.async = true
    s1.src = 'https://embed.tawk.to/6a39a58b452f781d473b5022/1jroitarb'
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    s0.parentNode?.insertBefore(s1, s0)
  }, [])
  return null
}
