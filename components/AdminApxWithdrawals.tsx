'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Clock3, ExternalLink, Loader2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatApx } from '@/lib/apx'

 type RequestRow = {
  id: string
  amount: number
  walletAddress: string
  network: string
  status: 'PENDING' | 'PAID' | 'REJECTED'
  txHash?: string | null
  adminNote?: string | null
  requestedAt: string
  user: { id: string; fullName: string; email: string }
}

export default function AdminApxWithdrawals() {
  const [filter, setFilter] = useState('PENDING')
  const [rows, setRows] = useState<RequestRow[]>([])
  const [selected, setSelected] = useState<RequestRow | null>(null)
  const [txHash, setTxHash] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/apx-withdrawals?status=${filter}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load APX payouts')
      setRows(data.requests || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load APX payouts')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const runAction = async (action: 'pay' | 'reject') => {
    if (!selected) return
    if (action === 'pay' && !/^0x[a-fA-F0-9]{64}$/.test(txHash.trim())) return toast.error('Enter the exact 0x transaction hash from the treasury wallet')
    if (action === 'pay' && !window.confirm(`Mark ${formatApx(selected.amount)} APX as paid to ${selected.walletAddress}?`)) return
    if (action === 'reject' && !window.confirm(`Reject this request and return ${formatApx(selected.amount)} APX to the user?`)) return

    setWorking(true)
    try {
      const response = await fetch('/api/admin/apx-withdrawals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, action, txHash: txHash.trim(), adminNote }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update payout')
      toast.success(data.message)
      setSelected(null)
      setTxHash('')
      setAdminNote('')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update payout')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Treasury operations</p><h2 className="mt-1 text-2xl font-black">Manual APX payouts</h2><p className="mt-2 max-w-2xl text-sm text-gray-500">Send APX from the treasury wallet first. Then mark the request as paid here with the confirmed BNB Smart Chain transaction hash.</p></div>
      <div className="flex flex-wrap gap-2">{['PENDING', 'PAID', 'REJECTED', 'ALL'].map(status => <button key={status} onClick={() => setFilter(status)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${filter === status ? 'border-[#c9a84c] bg-[#c9a84c] text-[#0a0a14]' : 'border-[#1e1e35] text-gray-400 hover:text-white'}`}>{status}</button>)}</div>

      <div className="overflow-hidden rounded-2xl border border-[#1e1e35] bg-[#12121f]">
        {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin text-[#c9a84c]" /></div> : rows.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">No APX payout requests in this view.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#0a0a14] text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-4">Investor</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Destination</th><th className="px-5 py-4">Requested</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-[#1e1e35]">{rows.map(row => <tr key={row.id} className="text-gray-300"><td className="px-5 py-4"><div className="font-semibold text-white">{row.user.fullName}</div><div className="text-xs text-gray-500">{row.user.email}</div></td><td className="px-5 py-4 font-bold text-[#e8cc7a]">{formatApx(row.amount)} APX</td><td className="px-5 py-4"><code className="text-xs text-gray-400">{row.walletAddress.slice(0, 10)}…{row.walletAddress.slice(-8)}</code><div className="text-xs text-gray-600">{row.network}</div></td><td className="px-5 py-4 text-xs text-gray-500">{new Date(row.requestedAt).toLocaleString()}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'PAID' ? 'bg-emerald-400/10 text-emerald-400' : row.status === 'REJECTED' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{row.status === 'PAID' ? <CheckCircle size={13} /> : row.status === 'REJECTED' ? <XCircle size={13} /> : <Clock3 size={13} />}{row.status}</span></td><td className="px-5 py-4">{row.status === 'PENDING' ? <button onClick={() => setSelected(row)} className="rounded-lg bg-[#c9a84c] px-3 py-1.5 text-xs font-bold text-[#0a0a14]">Review</button> : row.txHash ? <a className="inline-flex items-center gap-1 text-xs text-[#e8cc7a] hover:underline" href={`https://bscscan.com/tx/${row.txHash}`} target="_blank" rel="noreferrer">BscScan <ExternalLink size={12} /></a> : <span className="text-xs text-gray-600">—</span>}</td></tr>)}</tbody></table></div>}
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-[#1e1e35] bg-[#12121f] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-[#c9a84c]">Review APX payout</p><h3 className="mt-1 text-xl font-black">{formatApx(selected.amount)} APX</h3></div><button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">×</button></div><div className="mt-5 space-y-3 rounded-xl border border-[#1e1e35] bg-[#0a0a14] p-4 text-sm"><p><span className="text-gray-500">Investor:</span> {selected.user.fullName}</p><p><span className="text-gray-500">Wallet:</span> <code className="break-all text-xs text-gray-300">{selected.walletAddress}</code></p><p><span className="text-gray-500">Network:</span> BNB Smart Chain (BEP-20)</p></div><label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-gray-400">Treasury transaction hash <span className="normal-case text-gray-600">(required to mark paid)</span></label><input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x…" className="mt-2 w-full rounded-xl border border-[#1e1e35] bg-[#0a0a14] px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#c9a84c]" /><label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-gray-400">Admin note</label><textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Optional note" rows={3} className="mt-2 w-full resize-none rounded-xl border border-[#1e1e35] bg-[#0a0a14] px-4 py-3 text-sm text-white outline-none focus:border-[#c9a84c]" /><p className="mt-4 text-xs leading-5 text-gray-500">Only click Pay after the APX transfer is confirmed on BscScan. Rejecting returns the reserved APX to the user&apos;s available reward balance.</p><div className="mt-5 flex gap-3"><button onClick={() => runAction('reject')} disabled={working} className="flex-1 rounded-xl border border-red-500/30 px-4 py-3 text-sm font-bold text-red-400 disabled:opacity-50">Reject and return APX</button><button onClick={() => runAction('pay')} disabled={working} className="flex-1 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-sm font-black text-[#090A0F] disabled:opacity-50">{working ? 'Saving…' : 'Mark as paid'}</button></div></div></div>}
    </div>
  )
}
