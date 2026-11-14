'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

type Status = { enabled: boolean; setupPending: boolean }

export default function UserTwoFactorPanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [setup, setSetup] = useState<{ qrDataUrl: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const response = await fetch('/api/auth/2fa')
    if (response.ok) setStatus(await response.json())
  }
  useEffect(() => { load().catch(() => undefined) }, [])

  const startSetup = async () => {
    setLoading(true)
    const response = await fetch('/api/auth/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setup' }) })
    const data = await response.json(); setLoading(false)
    if (!response.ok) return toast.error(data.error || 'Unable to start 2FA setup')
    setSetup({ qrDataUrl: data.qrDataUrl, secret: data.secret }); setCode('')
  }

  const enable = async () => {
    setLoading(true)
    const response = await fetch('/api/auth/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enable', token: code }) })
    const data = await response.json(); setLoading(false)
    if (!response.ok) return toast.error(data.error || 'Invalid authenticator code')
    toast.success('Two-factor authentication enabled'); setSetup(null); setCode(''); await load()
  }

  const disable = async () => {
    setLoading(true)
    const response = await fetch('/api/auth/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disable', token: code, password }) })
    const data = await response.json(); setLoading(false)
    if (!response.ok) return toast.error(data.error || 'Unable to disable 2FA')
    toast.success('Two-factor authentication disabled'); setCode(''); setPassword(''); await load()
  }

  if (!status) return <div className="mt-3 h-16 animate-pulse rounded-xl bg-white/5" />
  return <div className="mt-3 rounded-xl border border-[#1E293B] bg-[#090A0F] p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EAB30825] bg-[#EAB30812]"><Smartphone size={15} className="text-[#EAB308]" /></div>
      <div className="min-w-0 flex-1"><div className="text-sm font-medium">Authenticator app</div><div className="mt-1 text-xs leading-5 text-gray-500">Use an authenticator app to protect sign-ins with a rotating 6-digit code.</div></div>
      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status.enabled ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gray-400/10 text-gray-400'}`}>{status.enabled ? 'Enabled' : 'Off'}</span>
    </div>
    {!status.enabled && !setup && <button onClick={startSetup} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-xs font-black text-[#090A0F] disabled:opacity-60">{loading && <Loader2 size={14} className="animate-spin" />}Set up 2FA</button>}
    {!status.enabled && setup && <div className="mt-4 space-y-4 border-t border-[#1E293B] pt-4"><div className="flex justify-center"><Image src={setup.qrDataUrl} alt="Scan this QR code with your authenticator app" width={176} height={176} unoptimized className="h-44 w-44 rounded-xl bg-white p-2" /></div><p className="text-center text-xs text-gray-500">Scan the QR code, then enter the 6-digit code shown by your app.</p><div className="rounded-lg border border-[#1E293B] p-3 text-center"><p className="text-[10px] uppercase tracking-wider text-gray-500">Manual setup key</p><p className="mt-1 break-all font-mono text-xs text-[#EAB308]">{setup.secret}</p></div><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="w-full rounded-xl border border-[#1E293B] bg-[#11131E] px-4 py-3 text-center text-sm tracking-[0.4em] text-white outline-none focus:border-[#EAB308]"/><div className="flex gap-2"><button onClick={()=>{setSetup(null);setCode('')}} className="flex-1 rounded-xl border border-[#1E293B] px-3 py-3 text-xs text-gray-400">Cancel</button><button onClick={enable} disabled={loading || code.length !== 6} className="flex-1 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-3 py-3 text-xs font-black text-[#090A0F] disabled:opacity-50">{loading ? 'Verifying…' : 'Verify & enable'}</button></div></div>}
    {status.enabled && <div className="mt-4 border-t border-[#1E293B] pt-4"><p className="mb-3 text-xs text-gray-500">To disable 2FA, confirm your current password and an authenticator code.</p><div className="space-y-2"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Current password" className="w-full rounded-xl border border-[#1E293B] bg-[#11131E] px-4 py-3 text-sm text-white outline-none focus:border-[#EAB308]"/><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="Authenticator code" className="w-full rounded-xl border border-[#1E293B] bg-[#11131E] px-4 py-3 text-sm text-white outline-none focus:border-[#EAB308]"/><button onClick={disable} disabled={loading || !password || code.length !== 6} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 px-4 py-3 text-xs font-bold text-red-300 disabled:opacity-50">{loading && <Loader2 size={14} className="animate-spin" />}Disable 2FA</button></div></div>}
  </div>
}
