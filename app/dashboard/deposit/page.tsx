'use client'
import { useState, useEffect } from 'react'
import { Copy, CheckCircle, Upload, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const COIN_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
  USDC: '$',
  XRP: '✕',
}

type Wallet = {
  id: string
  currency: string
  label: string
  address: string
  network: string
}

export default function DepositPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [selected, setSelected] = useState<Wallet | null>(null)
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/wallet-addresses')
      .then(r => r.json())
      .then((data: Wallet[]) => {
        setWallets(data)
        if (data.length > 0) setSelected(data[0])
        setLoadingWallets(false)
      })
      .catch(() => setLoadingWallets(false))
  }, [])

  const copy = () => {
    if (!selected) return
    navigator.clipboard.writeText(selected.address)
    setCopied(true)
    toast.success('Address copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!amount || !txHash || !selected) return toast.error('Please fill all fields')
    if (parseFloat(amount) < 50) return toast.error('Minimum deposit is $50')

    setSubmitting(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        currency: selected.currency,
        txHash,
        proofImageUrl: proofUrl || undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Deposit submitted! Your balance will be updated within 30 minutes after review.')
      setAmount(''); setTxHash(''); setProofUrl('')
    } else {
      toast.error(data.error || 'Submission failed')
    }
    setSubmitting(false)
  }

  if (loadingWallets) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black mb-1">Make a Deposit</h1>
        <p className="text-gray-500 text-sm">Send crypto to the address below, then submit your transaction hash for verification.</p>
      </div>

      {/* Select currency */}
      <div className="card-dark p-6">
        <h2 className="font-bold mb-4">Select Payment Method</h2>
        <div className={`grid gap-3 ${wallets.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {wallets.map(w => (
            <button key={w.id} onClick={() => setSelected(w)}
              className={`p-4 rounded-xl border text-center transition-all ${selected?.id === w.id
                ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                : 'border-[#1e1e35] hover:border-[#c9a84c]/40'}`}>
              <div className="text-2xl mb-1">{COIN_ICONS[w.currency] || '●'}</div>
              <div className="text-xs font-bold">{w.currency}</div>
              <div className="text-gray-500 text-xs">{w.network}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Wallet address */}
      {selected && (
        <div className="card-dark p-6">
          <h2 className="font-bold mb-1">Send {selected.label} to this address</h2>
          <p className="text-gray-500 text-xs mb-4">
            Only send <strong className="text-white">{selected.currency}</strong> on the <strong className="text-white">{selected.network}</strong> network. Sending on the wrong network will result in permanent loss of funds.
          </p>

          <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-4 flex items-center gap-3 mb-4">
            <code className="flex-1 text-[#c9a84c] text-sm font-mono break-all">{selected.address}</code>
            <button onClick={copy} className="flex-shrink-0 text-gray-400 hover:text-[#c9a84c] transition-colors">
              {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 text-xs">
            ⚠️ Minimum deposit: <strong>$50</strong>. Deposits are reviewed and credited within 30 minutes.
          </div>
        </div>
      )}

      {/* Confirm deposit */}
      <div className="card-dark p-6">
        <h2 className="font-bold mb-4">Confirm Your Deposit</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" min="50" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Hash / ID *</label>
            <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)}
              placeholder="Paste your TX hash here"
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
            <p className="text-gray-600 text-xs mt-1">Found in your wallet or exchange after sending</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Proof Screenshot URL <span className="text-gray-500">(optional)</span></label>
            <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
          </div>

          <button onClick={handleSubmit} disabled={submitting || !amount || !txHash || !selected}
            className="w-full btn-gold py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {submitting ? 'Submitting...' : 'Submit Deposit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
