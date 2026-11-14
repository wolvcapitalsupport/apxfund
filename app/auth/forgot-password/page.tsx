'use client'
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true)
    const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const data = await response.json()
    setLoading(false)
    if (!response.ok) return toast.error(data.error || 'Unable to send reset link')
    setSent(true); toast.success('Check your email for a reset link')
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#090A0F] px-5 py-12 text-white"><div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#11131E] p-7"><div className="mb-7 text-center"><ShieldCheck className="mx-auto mb-3 text-[#EAB308]" size={30}/><h1 className="text-2xl font-black">Reset your password</h1><p className="mt-2 text-sm text-gray-500">We will email you a secure, one-time reset link.</p></div>{sent ? <div className="space-y-5 text-center"><p className="text-sm leading-6 text-gray-400">If an account exists for that email, the reset link is on its way. Check your inbox and spam folder.</p><Link href="/auth/login" className="block rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-sm font-black text-[#090A0F]">Return to login</Link></div> : <form onSubmit={submit} className="space-y-4"><label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-[#1e293b] bg-[#090A0F] px-11 py-3 text-sm outline-none focus:border-[#EAB308]" placeholder="you@example.com"/></div><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-sm font-black text-[#090A0F] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={16}/>}Send reset link</button><Link href="/auth/login" className="block text-center text-sm text-gray-500 hover:text-white">Back to login</Link></form>}</div></main>
}
