'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handleInput = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) {
      submitOtp(next.join(''))
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      const digits = paste.split('')
      setOtp(digits)
      inputs.current[5]?.focus()
      submitOtp(paste)
    }
  }

  const submitOtp = async (code: string) => {
    setLoading(true)
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: code }),
    })
    const data = await res.json()
    if (res.ok) {
      setVerified(true)
      toast.success('Email verified!')
      setTimeout(() => router.push('/auth/login'), 2500)
    } else {
      toast.error(data.error || 'Invalid code')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    }
    setLoading(false)
  }

  const resend = async () => {
    setResending(true)
    const res = await fetch('/api/auth/verify-email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) { toast.success('New code sent!'); setCountdown(60) }
    else toast.error(data.error)
    setResending(false)
  }

  if (verified) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-black mb-2">Email Verified!</h2>
        <p className="text-gray-500 text-sm mb-6">Redirecting you to login...</p>
        <div className="w-6 h-6 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <>
      <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6">
        <TrendingUp size={24} className="text-[#0a0a14]" />
      </div>
      <h2 className="text-2xl font-black text-center mb-2">Verify Your Email</h2>
      <p className="text-gray-500 text-sm text-center mb-2">
        We sent a 6-digit code to
      </p>
      <p className="text-[#c9a84c] text-sm font-semibold text-center mb-8 break-all">{email}</p>

      {/* OTP inputs */}
      <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-black rounded-xl border bg-[#0a0a14] text-white focus:outline-none transition-all
              ${digit ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#1e1e35] focus:border-[#c9a84c]'}`}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
          <Loader2 size={16} className="animate-spin" />
          Verifying...
        </div>
      )}

      <button
        onClick={() => submitOtp(otp.join(''))}
        disabled={loading || otp.some(d => !d)}
        className="w-full btn-gold py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 mb-5">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        Verify Email
      </button>

      <div className="text-center text-sm text-gray-500">
        Didn&apos;t receive the code?{' '}
        {countdown > 0 ? (
          <span className="text-gray-600">Resend in {countdown}s</span>
        ) : (
          <button onClick={resend} disabled={resending}
            className="text-[#c9a84c] hover:underline font-semibold disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        )}
      </div>

      <div className="text-center mt-4">
        <Link href="/auth/register" className="text-xs text-gray-600 hover:text-gray-400">
          ← Back to Register
        </Link>
      </div>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[#1e1e35]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <TrendingUp size={15} className="text-[#0a0a14]" />
          </div>
          <span className="text-lg font-bold"><span className="gold-text">APX</span>Fund</span>
        </Link>
        <Link href="/" className="text-xs text-gray-400 border border-[#1e1e35] px-3 py-1.5 rounded-lg">← Home</Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="card-dark p-8 rounded-2xl">
            <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
              <VerifyEmailForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
