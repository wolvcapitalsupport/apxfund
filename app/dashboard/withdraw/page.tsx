'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WithdrawPage() {
  const [balance, setBalance] = useState(0)
  const [form, setForm] = useState({ amount: '', walletAddress: '', currency: 'BTC' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(d => { setBalance(d.balance); setLoading(false) })
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parseFloat(form.amount) > balance) return toast.error('Insufficient balance')
    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WITHDRAWAL', ...form, amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error)
      else {
        toast.success('Withdrawal request submitted! Processing within 24 hours.')
        setForm({ amount: '', walletAddress: '', currency: 'BTC' })
        setBalance(b => b - parseFloat(form.amount))
      }
    } catch { toast.error('Request failed') }
    finally { setSubmitting(false) }
  }

  const inputClass = "w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors"

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">Withdraw Funds</h1>
        <p className="text-gray-500 text-sm">Submit a withdrawal request. Processed within 24 hours.</p>
      </div>

      <div className="card-dark p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-400/10 flex items-center justify-center">
          <ArrowUpCircle size={22} className="text-green-400" />
        </div>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wider">Available Balance</div>
          <div className="text-2xl font-black gold-text">{formatCurrency(balance)}</div>
        </div>
      </div>

      <div className="card-dark p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
            <select value={form.currency} onChange={set('currency')} className={inputClass}>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="USDT">Tether (USDT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Wallet Address</label>
            <input type="text" required value={form.walletAddress} onChange={set('walletAddress')}
              placeholder="Your crypto wallet address" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD)</label>
            <input type="number" required min="10" max={balance} value={form.amount}
              onChange={set('amount')} placeholder="Min: $10" className={inputClass} />
            {form.amount && parseFloat(form.amount) > balance && (
              <p className="text-red-400 text-xs mt-1">Insufficient balance</p>
            )}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-400 text-xs">
            ℹ️ Minimum withdrawal: $10. Funds will be sent to your wallet within 24 hours of approval.
          </div>
          <button type="submit" disabled={submitting || !form.amount || parseFloat(form.amount) > balance}
            className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <><Loader2 size={16} className="animate-spin" />Processing...</> : <><ArrowUpCircle size={16} />Request Withdrawal</>}
          </button>
        </form>
      </div>
    </div>
  )
}
