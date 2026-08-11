'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDownUp, Coins, Loader2 } from 'lucide-react'
import { APX_BUY_RATE, APX_REDEMPTION_RATE, formatApx } from '@/lib/apx'

interface MeData {
  balance: number
  apxBalance: number
  apxRewards: number
}

export default function ApxWalletPage() {
  const [me, setMe] = useState<MeData | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [buyUsd, setBuyUsd] = useState('')
  const [redeemApx, setRedeemApx] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [userRes, reqRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/apx/redeem'),
      ])
      const user = await userRes.json()
      const reqs = await reqRes.json()
      setMe(user)
      setRequests(Array.isArray(reqs) ? reqs : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const estBuyApx = useMemo(() => {
    const usd = parseFloat(buyUsd || '0')
    if (!usd || usd <= 0) return 0
    return usd / APX_BUY_RATE
  }, [buyUsd])

  const estRedeemUsd = useMemo(() => {
    const apx = parseFloat(redeemApx || '0')
    if (!apx || apx <= 0) return 0
    return apx * APX_REDEMPTION_RATE
  }, [redeemApx])

  const onBuy = async () => {
    const usdAmount = parseFloat(buyUsd)
    if (!usdAmount || usdAmount < 10) return toast.error('Minimum APX buy is $10')
    setSubmitting(true)
    try {
      const res = await fetch('/api/apx/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdAmount }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Buy failed')
      toast.success(data.message)
      setBuyUsd('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const onRedeem = async () => {
    const apxAmount = parseFloat(redeemApx)
    if (!apxAmount || apxAmount <= 0) return toast.error('Enter APX amount')
    setSubmitting(true)
    try {
      const res = await fetch('/api/apx/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apxAmount }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Redemption failed')
      toast.success(data.message)
      setRedeemApx('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">APX Wallet</h1>
        <p className="text-gray-500 text-sm">Internal APX economy before public liquidity listing.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card label="USD Balance" value={`$${(me?.balance || 0).toFixed(2)}`} />
        <Card label="APX Balance" value={`${formatApx(me?.apxBalance || 0)} APX`} />
        <Card label="APX Earned" value={`${formatApx(me?.apxRewards || 0)} APX`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card-dark p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Coins size={16} className="text-[#EAB308]" /> Buy APX</h2>
          <p className="text-xs text-gray-500">Internal buy rate: ${APX_BUY_RATE} per APX</p>
          <input
            type="number"
            min={10}
            value={buyUsd}
            onChange={e => setBuyUsd(e.target.value)}
            placeholder="USD amount"
            className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]"
          />
          <div className="text-xs text-gray-400">Estimated APX: <span className="text-white font-semibold">{formatApx(estBuyApx)}</span></div>
          <button onClick={onBuy} disabled={submitting} className="btn-gold w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60">
            {submitting ? 'Processing...' : 'Buy APX'}
          </button>
        </div>

        <div className="card-dark p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><ArrowDownUp size={16} className="text-[#34d399]" /> Redeem APX</h2>
          <p className="text-xs text-gray-500">Option B workflow: queued + weekly/admin settlement at ${APX_REDEMPTION_RATE} per APX</p>
          <input
            type="number"
            min={0.01}
            value={redeemApx}
            onChange={e => setRedeemApx(e.target.value)}
            placeholder="APX amount"
            className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]"
          />
          <div className="text-xs text-gray-400">Estimated USD credit: <span className="text-white font-semibold">${estRedeemUsd.toFixed(2)}</span></div>
          <button onClick={onRedeem} disabled={submitting} className="w-full py-3 rounded-xl text-sm font-bold border border-[#34d399]/40 text-[#34d399] hover:bg-[#34d399]/10 disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Redemption Request'}
          </button>
        </div>
      </div>

      <div className="card-dark p-5">
        <h3 className="font-bold mb-3">Redemption Queue History</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500">No redemption requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-[#1e1e35]">
                  <th className="py-2">Requested</th>
                  <th className="py-2">APX</th>
                  <th className="py-2">USD Value</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any) => (
                  <tr key={r.id} className="border-b border-[#1e1e35] text-gray-300">
                    <td className="py-2">{new Date(r.requestedAt).toLocaleString()}</td>
                    <td className="py-2">{formatApx(r.amount)}</td>
                    <td className="py-2">${r.usdValue.toFixed(2)}</td>
                    <td className="py-2">{r.status}</td>
                    <td className="py-2 text-gray-500">{r.adminNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-dark p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-black text-[#EAB308]">{value}</p>
    </div>
  )
}
