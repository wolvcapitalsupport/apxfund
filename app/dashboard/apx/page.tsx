'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowDownUp, Coins, ArrowLeftRight, Wallet, ExternalLink, Copy, Check, SmartphoneNfc } from 'lucide-react'
import { APX_BUY_RATE, APX_REDEMPTION_RATE, APX_MIN_REDEMPTION_APX, APX_MIN_REDEMPTION_USD, formatApx } from '@/lib/apx'

interface MeData {
  balance: number
  apxBalance: number
  apxRewards: number
}

export default function ApxWalletPage() {
  const [me, setMe] = useState<MeData | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [buyUsd, setBuyUsd] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const CONTRACT = '0x8d6032443cb7b23c134094c8921f1f37824ea3a2'
  const TOKEN_SYMBOL = 'APX'
  const TOKEN_DECIMALS = 18

  const addToWallet = async () => {
    try {
      const win = window as any
      if (!win.ethereum) return toast.error('No Web3 wallet detected. Install MetaMask or Trust Wallet.')
      await win.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT,
            symbol: TOKEN_SYMBOL,
            decimals: TOKEN_DECIMALS,
          },
        },
      })
      toast.success('APX token added to your wallet!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add token')
    }
  }

  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Redemption — bidirectional
  const [redeemMode, setRedeemMode] = useState<'apx' | 'usd'>('usd')
  const [redeemApx, setRedeemApx] = useState('')
  const [redeemUsd, setRedeemUsd] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [userRes, reqRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/apx/redeem'),
      ])
      setMe(await userRes.json())
      const reqs = await reqRes.json()
      setRequests(Array.isArray(reqs) ? reqs : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const estBuyApx = useMemo(() => {
    const usd = parseFloat(buyUsd || '0')
    return usd > 0 ? usd / APX_BUY_RATE : 0
  }, [buyUsd])

  // Derived redemption values — whichever field user typed, compute the other
  const derivedRedeemApx = useMemo(() => {
    if (redeemMode === 'apx') return parseFloat(redeemApx || '0') || 0
    const usd = parseFloat(redeemUsd || '0')
    return usd > 0 ? usd / APX_REDEMPTION_RATE : 0
  }, [redeemMode, redeemApx, redeemUsd])

  const derivedRedeemUsd = useMemo(() => {
    if (redeemMode === 'usd') return parseFloat(redeemUsd || '0') || 0
    const apx = parseFloat(redeemApx || '0')
    return apx > 0 ? apx * APX_REDEMPTION_RATE : 0
  }, [redeemMode, redeemApx, redeemUsd])

  const toggleRedeemMode = () => {
    setRedeemMode(m => m === 'apx' ? 'usd' : 'apx')
    setRedeemApx('')
    setRedeemUsd('')
  }

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
    const apxAmount = derivedRedeemApx
    if (!apxAmount || apxAmount <= 0) return toast.error('Enter an amount')
    if (apxAmount < APX_MIN_REDEMPTION_APX) {
      return toast.error(`Minimum redemption is ${APX_MIN_REDEMPTION_APX.toLocaleString()} APX ($${APX_MIN_REDEMPTION_USD.toLocaleString()})`)
    }
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
      setRedeemUsd('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const apxUsdValue = (me?.apxBalance || 0) * APX_REDEMPTION_RATE
  const apxRewardsUsdValue = (me?.apxRewards || 0) * APX_REDEMPTION_RATE

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

      {/* Balance cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <BalanceCard
          label="USD Balance"
          primary={`$${(me?.balance || 0).toFixed(2)}`}
        />
        <BalanceCard
          label="APX Balance"
          primary={`${formatApx(me?.apxBalance || 0)} APX`}
          secondary={`≈ $${apxUsdValue.toFixed(2)} USD`}
          secondaryNote={`@ $${APX_REDEMPTION_RATE}/APX`}
        />
        <BalanceCard
          label="APX Earned (Total)"
          primary={`${formatApx(me?.apxRewards || 0)} APX`}
          secondary={`≈ $${apxRewardsUsdValue.toFixed(2)} USD`}
          secondaryNote="lifetime"
        />
      </div>

      {/* Import token to wallet */}
      <div className="card-dark p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2">
          <Wallet size={16} className="text-[#EAB308]" /> Add APX to Your Wallet
        </h2>
        <p className="text-xs text-gray-500">
          Follow these steps to import APX into MetaMask or Trust Wallet.
          You will see an &quot;unverified token&quot; warning — this is normal for new tokens and can be safely dismissed.
        </p>

        {/* Contract copy row */}
        <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 space-y-1">
          <p className="text-xs text-gray-500">Contract Address (BNB Smart Chain)</p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-gray-200 break-all flex-1">0x8d6032443cb7b23c134094c8921f1f37824ea3a2</p>
            <button onClick={copyContract} title="Copy address" className="text-gray-400 hover:text-white transition-colors shrink-0">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-gray-600">Symbol: APX &nbsp;·&nbsp; Decimals: 18 &nbsp;·&nbsp; Network: BNB Smart Chain</p>
        </div>

        {/* Step by step */}
        <ol className="space-y-2">
          {[
            'Open MetaMask or Trust Wallet on your device.',
            'Switch the network to BNB Smart Chain (BSC).',
            'Tap "Import Token" or "Add Custom Token".',
            'Paste the contract address above — symbol and decimals will fill automatically.',
            'You will see an unverified token warning. This is expected. Tap "Import" or "Confirm" to proceed.',
            'APX will now appear in your wallet and you can receive distributions.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-xs text-gray-400">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30 text-[#EAB308] flex items-center justify-center font-bold text-[10px]">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <a
          href="https://bscscan.com/token/0x8d6032443cb7b23c134094c8921f1f37824ea3a2"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#c9a84c] hover:underline"
        >
          <ExternalLink size={12} /> Verify contract on BscScan
        </a>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Buy APX */}
        <div className="card-dark p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <Coins size={16} className="text-[#EAB308]" /> Buy APX
          </h2>
          <p className="text-xs text-gray-500">Internal buy rate: ${APX_BUY_RATE} per APX</p>
          <input
            type="number"
            min={10}
            value={buyUsd}
            onChange={e => setBuyUsd(e.target.value)}
            placeholder="USD amount"
            className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]"
          />
          <div className="text-xs text-gray-400">
            You receive: <span className="text-white font-semibold">{formatApx(estBuyApx)} APX</span>
          </div>
          <button onClick={onBuy} disabled={submitting} className="btn-gold w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60">
            {submitting ? 'Processing...' : 'Buy APX'}
          </button>
        </div>

        {/* Redeem APX — bidirectional */}
        <div className="card-dark p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <ArrowDownUp size={16} className="text-[#34d399]" /> Redeem APX
          </h2>
          <p className="text-xs text-gray-500">
            Rate: ${APX_REDEMPTION_RATE}/APX — min ${APX_MIN_REDEMPTION_USD.toLocaleString()} USD — admin approval required
          </p>

          {/* Input row with swap toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  {redeemMode === 'apx' ? 'APX Amount' : 'USD Amount'}
                </label>
                {redeemMode === 'apx' ? (
                  <input
                    type="number"
                    min={0}
                    value={redeemApx}
                    onChange={e => setRedeemApx(e.target.value)}
                    placeholder="Enter APX"
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#34d399]"
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={redeemUsd}
                    onChange={e => setRedeemUsd(e.target.value)}
                    placeholder="Enter USD"
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#34d399]"
                  />
                )}
              </div>

              {/* Swap button */}
              <button
                onClick={toggleRedeemMode}
                title="Switch input between APX and USD"
                className="mt-5 p-2.5 rounded-xl border border-[#1e1e35] text-[#34d399] hover:bg-[#34d399]/10 transition-colors"
              >
                <ArrowLeftRight size={16} />
              </button>
            </div>

            {/* Computed other side */}
            <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3">
              {redeemMode === 'apx' ? (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">You receive (USD)</span>
                  <span className="text-sm font-bold text-[#34d399]">
                    ${derivedRedeemUsd.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">APX to redeem</span>
                  <span className="text-sm font-bold text-[#34d399]">
                    {formatApx(derivedRedeemApx)} APX
                  </span>
                </div>
              )}
            </div>

            {/* Minimum warning */}
            {derivedRedeemApx > 0 && derivedRedeemApx < APX_MIN_REDEMPTION_APX && (
              <p className="text-xs text-red-400">
                Minimum: {APX_MIN_REDEMPTION_APX.toLocaleString()} APX (${APX_MIN_REDEMPTION_USD.toLocaleString()})
              </p>
            )}
          </div>

          <button
            onClick={onRedeem}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-bold border border-[#34d399]/40 text-[#34d399] hover:bg-[#34d399]/10 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Redemption Request'}
          </button>
        </div>
      </div>


      {/* Redemption history */}
      <div className="card-dark p-5">
        <h3 className="font-bold mb-3">Redemption History</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500">No redemption requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-[#1e1e35]">
                  <th className="py-2">Date</th>
                  <th className="py-2">APX</th>
                  <th className="py-2">USD Value</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any) => (
                  <tr key={r.id} className="border-b border-[#1e1e35] text-gray-300">
                    <td className="py-2 text-xs">{new Date(r.requestedAt).toLocaleString()}</td>
                    <td className="py-2">{formatApx(r.amount)}</td>
                    <td className="py-2">${r.usdValue.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === 'SETTLED' ? 'bg-green-500/10 text-green-400' :
                        r.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400' :
                        r.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{r.adminNote || '-'}</td>
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

function BalanceCard({
  label, primary, secondary, secondaryNote
}: {
  label: string
  primary: string
  secondary?: string
  secondaryNote?: string
}) {
  return (
    <div className="card-dark p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-black text-[#EAB308]">{primary}</p>
      {secondary && (
        <p className="text-sm text-gray-400 mt-0.5">
          {secondary}
          {secondaryNote && <span className="text-xs text-gray-600 ml-1">{secondaryNote}</span>}
        </p>
      )}
    </div>
  )
}

