'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Row = {
  id: string
  userId: string
  amount: number
  usdValue: number
  rateUsd: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED'
  adminNote?: string | null
  requestedAt: string
  user: {
    fullName: string
    email: string
  }
}

export default function AdminApxRedemptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState('PENDING')
  const [note, setNote] = useState('')
  const [workingId, setWorkingId] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch(`/api/admin/apx-redemptions?status=${filter}`)
    const data = await res.json()
    setRows(data.requests || [])
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      load()
    }
  }, [status, session, filter])

  const runAction = async (id: string, action: 'approve' | 'reject' | 'settle') => {
    setWorkingId(id)
    const res = await fetch('/api/admin/apx-redemptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redemptionId: id, action, adminNote: note || undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Action failed')
    } else {
      toast.success(data.message)
      setNote('')
      await load()
    }
    setWorkingId(null)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-black">APX Redemption Queue</h1>
          <p className="text-sm text-gray-500">Option B operations: approve queue, reject with APX refund, and settle to USD balance.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['PENDING', 'APPROVED', 'REJECTED', 'SETTLED', 'ALL'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === s ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#12121f] border border-[#1e1e35] text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="card-dark p-4">
          <label className="text-xs text-gray-500 block mb-2">Admin Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]"
            placeholder="Reason or settlement note"
          />
        </div>

        <div className="card-dark overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a14]">
              <tr>
                {['User', 'APX', 'USD', 'Rate', 'Status', 'Requested', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e35]">
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.user.fullName}</div>
                    <div className="text-xs text-gray-500">{r.user.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">${r.usdValue.toFixed(2)}</td>
                  <td className="px-4 py-3">${r.rateUsd}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.requestedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button disabled={workingId === r.id} onClick={() => runAction(r.id, 'approve')} className="px-2.5 py-1 rounded-lg text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-60">Approve</button>
                          <button disabled={workingId === r.id} onClick={() => runAction(r.id, 'reject')} className="px-2.5 py-1 rounded-lg text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-60">Reject</button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <>
                          <button disabled={workingId === r.id} onClick={() => runAction(r.id, 'settle')} className="px-2.5 py-1 rounded-lg text-xs border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/10 disabled:opacity-60">Settle</button>
                          <button disabled={workingId === r.id} onClick={() => runAction(r.id, 'reject')} className="px-2.5 py-1 rounded-lg text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-60">Reject</button>
                        </>
                      )}
                      {(r.status === 'REJECTED' || r.status === 'SETTLED') && (
                        <span className="text-xs text-gray-600">Done</span>
                      )}
                    </div>
                    {r.adminNote && <div className="text-[11px] text-gray-500 mt-1">{r.adminNote}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="p-6 text-sm text-gray-500">No redemption requests found for this filter.</div>}
        </div>
      </div>
    </div>
  )
}
