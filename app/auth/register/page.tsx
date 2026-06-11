'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Eye, EyeOff, Loader2, Shield, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

export default function RegisterPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', country: '',
    referralCode: '', utmSource: '', utmMedium: '', utmCampaign: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setForm(c => ({
      ...c,
      referralCode: params.get('ref') ?? c.referralCode,
      utmSource: params.get('utm_source') ?? c.utmSource,
      utmMedium: params.get('utm_medium') ?? c.utmMedium,
      utmCampaign: params.get('utm_campaign') ?? c.utmCampaign,
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || (lang === 'de' ? 'Registrierung fehlgeschlagen' : 'Registration failed'))
      } else {
        toast.success(lang === 'de' ? 'Konto erstellt! Bitte E-Mail bestätigen.' : 'Account created! Please verify your email.')
        router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`)
      }
    } catch {
      toast.error(lang === 'de' ? 'Etwas ist schiefgelaufen.' : 'Something went wrong.')
    }
    setLoading(false)
  }

  const fields = [
    { key: 'fullName', label: t(lang, 'auth.fullName'), type: 'text', placeholder: lang === 'de' ? 'Vor- und Nachname' : 'John Doe' },
    { key: 'email', label: t(lang, 'auth.email'), type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: t(lang, 'auth.phone'), type: 'text', placeholder: '+1 555 000 0000' },
    { key: 'country', label: t(lang, 'auth.country'), type: 'text', placeholder: lang === 'de' ? 'Deutschland' : 'United States' },
    { key: 'referralCode', label: t(lang, 'auth.referral'), type: 'text', placeholder: lang === 'de' ? 'Optional' : 'Optional' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      {/* Mobile nav */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[#1e1e35]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <TrendingUp size={15} className="text-[#0a0a14]" />
          </div>
          <span className="text-lg font-bold"><span className="gold-text">APX</span>Fund</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
            className="text-xs border border-[#1e1e35] px-2 py-1 rounded-lg text-gray-400 hover:text-white transition-colors">
            {lang === 'en' ? 'DE' : 'EN'}
          </button>
          <Link href="/" className="text-xs text-gray-400 hover:text-white border border-[#1e1e35] px-3 py-1.5 rounded-lg transition-colors">
            ← {t(lang, 'nav.home')}
          </Link>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col w-[45%] bg-[#12121f] border-r border-[#1e1e35] p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#c9a84c 1px,transparent 1px),linear-gradient(90deg,#c9a84c 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          <Link href="/" className="flex items-center gap-3 mb-16 relative z-10">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <TrendingUp size={18} className="text-[#0a0a14]" />
            </div>
            <span className="text-xl font-bold"><span className="gold-text">APX</span>Fund</span>
          </Link>
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-black mb-4 leading-tight">
              {lang === 'de' ? 'Beginnen Sie' : 'Start'}<br />
              <span className="gold-text">{lang === 'de' ? 'noch heute.' : 'earning today.'}</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-10">
              {lang === 'de'
                ? 'Erstellen Sie Ihr kostenloses Konto und beginnen Sie in wenigen Minuten mit dem Investieren.'
                : 'Create your free account and start investing in minutes with plans starting from $200.'}
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: lang === 'de' ? 'KYC-geprüfte Plattform' : 'KYC-verified platform' },
                { icon: BarChart3, text: lang === 'de' ? 'Pläne ab 200 $' : 'Plans starting from $200' },
                { icon: TrendingUp, text: lang === 'de' ? 'Auszahlungen innerhalb von 24 Stunden' : 'Withdrawals within 24 hours' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-[#c9a84c]" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3 mt-8">
            <button onClick={() => setLang('en')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${lang === 'en' ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-[#1e1e35] text-gray-500 hover:text-white'}`}>
              EN
            </button>
            <button onClick={() => setLang('de')}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${lang === 'de' ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-[#1e1e35] text-gray-500 hover:text-white'}`}>
              DE
            </button>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md py-8">
            <h1 className="text-3xl font-black mb-2">{t(lang, 'auth.registerTitle')}</h1>
            <p className="text-gray-500 mb-8">{t(lang, 'auth.registerSub')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={['fullName', 'email'].includes(key)}
                    className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">{t(lang, 'auth.password')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" required minLength={8}
                    className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-gold py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 size={16} className="animate-spin" />{t(lang, 'auth.creating')}</> : t(lang, 'auth.register')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t(lang, 'auth.hasAccount')}{' '}
              <Link href="/auth/login" className="text-[#c9a84c] font-semibold hover:underline">
                {t(lang, 'auth.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
