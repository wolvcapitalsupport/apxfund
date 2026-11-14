'use client'
import { FormEvent, useState } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  useEffect(() => setToken(new URLSearchParams(window.location.search).get('token') || ''), [])
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); if (password !== confirm) return toast.error('Passwords do not match'); setLoading(true); const response = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, password }) }); const data=await response.json(); setLoading(false); if (!response.ok) return toast.error(data.error || 'Unable to reset password'); setDone(true); toast.success('Password updated') }
  return <main className="flex min-h-screen items-center justify-center bg-[#090A0F] px-5 py-12 text-white"><div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#11131E] p-7"><div className="mb-7 text-center"><ShieldCheck className="mx-auto mb-3 text-[#EAB308]" size={30}/><h1 className="text-2xl font-black">Create a new password</h1></div>{done ? <div className="space-y-5 text-center"><p className="text-sm text-gray-400">Your password has been updated securely.</p><Link href="/auth/login" className="block rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-sm font-black text-[#090A0F]">Sign in</Link></div> : <form onSubmit={submit} className="space-y-4"><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (8+ characters)" className="w-full rounded-xl border border-[#1e293b] bg-[#090A0F] px-4 py-3 text-sm outline-none focus:border-[#EAB308]"/><input required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border border-[#1e293b] bg-[#090A0F] px-4 py-3 text-sm outline-none focus:border-[#EAB308]"/><button disabled={loading || !token} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-sm font-black text-[#090A0F] disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={16}/>}Update password</button>{!token && <p className="text-center text-xs text-red-300">This reset link is missing or invalid.</p>}</form>}</div></main>
}
