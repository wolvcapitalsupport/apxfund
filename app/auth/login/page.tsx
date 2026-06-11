'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Eye, EyeOff, Loader2, Shield, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await signIn('credentials', {
      email: form.email, password: form.password, redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`)
      } else {
        toast.error(result.error)
      }
    } else {
      toast.success(lang === 'de' ? 'Willkommen zurück!' : 'Welcome back!')
      router.push('/dashboard')
      router.refresh()
    }
  }

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
              {lang === 'de' ? 'Ihr Kapital.' : 'Your Capital.'}<br />
              <span className="gold-text">{lang === 'de' ? 'Immer im Einsatz.' : 'Always Working.'}</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-10">
              {lang === 'de'
                ? 'Melden Sie sich an, um Ihr Portfolio einzusehen, Einzahlungen zu verwalten und Ihre Renditen zu verfolgen.'
                : 'Sign in to view your portfolio, manage deposits, and track your returns in real time.'}
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: lang === 'de' ? 'Banksichere Verschlüsselung' : 'Bank-grade encryption' },
                { icon: BarChart3, text: lang === 'de' ? 'Echtzeit-Portfolio-Tracking' : 'Real-time portfolio tracking' },
                { icon: TrendingUp, text: lang === 'de' ? 'Automatische Renditeauszahlung' : 'Automated yield disbursement' },
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
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-black mb-2">{t(lang, 'auth.loginTitle')}</h1>
            <p className="text-gray-500 mb-8">{t(lang, 'auth.loginSub')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">{t(lang, 'auth.email')}</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" required
                  className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">{t(lang, 'auth.password')}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" required
                    className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-gold py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 size={16} className="animate-spin" />{t(lang, 'auth.verifying')}</> : t(lang, 'auth.login')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {t(lang, 'auth.noAccount')}{' '}
              <Link href="/auth/register" className="text-[#c9a84c] font-semibold hover:underline">
                {t(lang, 'auth.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
