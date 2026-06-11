'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useLang } from '@/lib/useLang'
import { translations } from '@/lib/i18n'

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { lang, setLang } = useLang()
  const nav = translations[lang].nav

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const NAV_LINKS = [
    { label: nav.home,     href: '/' },
    { label: nav.plans,    href: '/investment-plans' },
    { label: nav.about,    href: '/about' },
    { label: nav.team,     href: '/our-team' },
    { label: nav.policies, href: '/policies' },
    { label: 'Contact',     href: '/contact' },
  ]

  return (
    <>
      {/* Crypto ticker */}
      <div className="w-full bg-[#0d0d1a] border-b border-[#1e1e35] overflow-hidden py-2 hidden md:block">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap px-6 text-xs text-gray-400">
          {[
            { sym: 'BTC',  price: '$67,420', change: '+2.4%', up: true },
            { sym: 'ETH',  price: '$3,512',  change: '+1.8%', up: true },
            { sym: 'SOL',  price: '$178.4',  change: '-0.6%', up: false },
            { sym: 'BNB',  price: '$608.2',  change: '+1.1%', up: true },
            { sym: 'XRP',  price: '$0.612',  change: '+3.2%', up: true },
            { sym: 'ADA',  price: '$0.481',  change: '-1.0%', up: false },
            { sym: 'BTC',  price: '$67,420', change: '+2.4%', up: true },
            { sym: 'ETH',  price: '$3,512',  change: '+1.8%', up: true },
          ].map((coin, i) => (
            <span key={i} className="inline-flex items-center gap-2 mr-8">
              <span className="font-bold text-gray-200">{coin.sym}</span>
              <span>{coin.price}</span>
              <span className={coin.up ? 'text-green-400' : 'text-red-400'}>{coin.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Contact bar */}
      <div className="hidden md:block bg-[#12121f] border-b border-[#1e1e35] text-xs text-gray-500 py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span>📍 3536 Badger Pond Lane, Pittsburgh, PA 15212, US</span>
            <span>✉️ support@apxfund.xyz</span>
          </div>
          <div className="flex items-center gap-4">
            <span>📞 +1 (412) 555-0198</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Markets Open
            </span>
            {/* Language switcher */}
            <div className="flex items-center gap-1 border border-[#1e1e35] rounded-lg overflow-hidden">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 text-xs font-semibold transition-all ${lang === 'en' ? 'bg-[#c9a84c] text-[#0a0a14]' : 'text-gray-500 hover:text-white'}`}>
                EN
              </button>
              <button
                onClick={() => setLang('de')}
                className={`px-2 py-0.5 text-xs font-semibold transition-all ${lang === 'de' ? 'bg-[#c9a84c] text-[#0a0a14]' : 'text-gray-500 hover:text-white'}`}>
                DE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || pathname !== '/'
          ? 'bg-[#0a0a14]/98 backdrop-blur border-b border-[#1e1e35] shadow-xl'
          : 'bg-[#0a0a14]/80 backdrop-blur'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/logo.png" alt="APXFund Logo" width={36} height={36} />
            <span className="text-xl font-black tracking-tight">
              <span className="gold-text">APX</span><span className="text-white">Fund</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(href)
                    ? 'text-[#c9a84c] bg-[#c9a84c]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Link href="/auth/login"
              className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg border border-[#1e1e35] hover:border-[#c9a84c]/50 transition-all">
              {nav.login}
            </Link>
            <Link href="/auth/register" className="btn-gold text-sm py-2 px-5 rounded-lg">
              {nav.getStarted}
            </Link>
          </div>

          <button className="lg:hidden text-gray-300 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-[#12121f] border-t border-[#1e1e35] px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(href) ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-gray-400 hover:text-white'
                }`}>
                {label}
              </Link>
            ))}
            {/* Mobile lang switcher */}
            <div className="flex gap-2 pt-2">
              {(['en', 'de'] as const).map(l => (
                <button key={l} onClick={() => { setLang(l); setMenuOpen(false) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    lang === l ? 'bg-[#c9a84c] text-[#0a0a14] border-[#c9a84c]' : 'border-[#1e1e35] text-gray-400'
                  }`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-3 border-t border-[#1e1e35] mt-3">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 border border-[#1e1e35] rounded-xl text-sm text-gray-300">
                {nav.login}
              </Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 btn-gold rounded-xl text-sm">
                {nav.getStarted}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
