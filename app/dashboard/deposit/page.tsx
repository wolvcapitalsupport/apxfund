'use client'
import { useState, useEffect } from 'react'
import { Copy, CheckCircle, Upload, Loader2, Shield, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

const COIN_ICONS: Record<string, string> = { BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '$', XRP: '✕' }
const COIN_COLORS: Record<string, string> = { BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B', USDC: '#2775CA', XRP: '#346AA9' }

type Wallet = { id: string; currency: string; label: string; address: string; network: string }

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

export default function DepositPage() {
  const { lang } = useLang()
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [selected, setSelected] = useState<Wallet | null>(null)
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [proofUploading, setProofUploading] = useState(false)
  const [proofDone, setProofDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/wallet-addresses').then(r => r.json()).then((data: Wallet[]) => {
      setWallets(data); if (data.length > 0) setSelected(data[0]); setLoadingWallets(false)
    }).catch(() => setLoadingWallets(false))
  }, [])

  const copy = () => {
    if (!selected) return
    navigator.clipboard.writeText(selected.address)
    setCopied(true); toast.success('Address copied!'); setTimeout(() => setCopied(false), 2000)
  }

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setProofUploading(true)
    try { const url = await uploadFile(file); setProofUrl(url); setProofDone(true); toast.success('Proof uploaded') }
    catch (err: any) { toast.error(err.message || 'Upload failed') }
    finally { setProofUploading(false) }
  }

  const handleSubmit = async () => {
    if (!amount || !txHash || !selected) return toast.error('Please fill all fields')
    if (parseFloat(amount) < 50) return toast.error('Minimum deposit is $50')
    setSubmitting(true)
    const res = await fetch('/api/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DEPOSIT', amount: parseFloat(amount), currency: selected.currency, txHash, proofImageUrl: proofUrl || undefined }),
    })
    const data = await res.json()
    if (res.ok) { toast.success('Deposit submitted! Your balance will be updated within 30 minutes after review.'); setAmount(''); setTxHash(''); setProofUrl(''); setProofDone(false) }
    else toast.error(data.error || 'Submission failed')
    setSubmitting(false)
  }

  if (loadingWallets) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">{t(lang, 'dashboard.depositTitle')}</h1>
        <p className="text-gray-500 text-sm">{t(lang, 'dashboard.depositSub')}</p>
      </div>

      {/* Security badge */}
      <div style={{ background: '#10B98110', border: '1px solid #10B98130', borderRadius: 12, padding: '12px 16px' }}
        className="flex items-center gap-3">
        <Shield size={16} style={{ color: '#10B981', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: '#10B981' }}>All deposits are secured with 256-bit encryption. Funds credited within 30 minutes of verification.</p>
      </div>

      {/* Select currency */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
        <h2 className="font-bold mb-5">{t(lang, 'dashboard.selectPayment')}</h2>
        <div className={`grid gap-3 ${wallets.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {wallets.map(w => {
            const coinColor = COIN_COLORS[w.currency] || '#EAB308'
            const isSelected = selected?.id === w.id
            return (
              <button key={w.id} onClick={() => setSelected(w)}
                style={{
                  padding: '16px 8px', borderRadius: 12, border: `1px solid ${isSelected ? coinColor : '#1E293B'}`,
                  background: isSelected ? `${coinColor}12` : '#090A0F', textAlign: 'center', transition: 'all 0.2s',
                }}>
                <div className="text-2xl mb-2" style={{ color: isSelected ? coinColor : '#64748b' }}>{COIN_ICONS[w.currency] || '●'}</div>
                <div className="text-xs font-bold text-white">{w.currency}</div>
                <div className="text-gray-600 text-xs mt-0.5">{w.network}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Wallet address */}
      {selected && (
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
          <h2 className="font-bold mb-1">Send {selected.label}</h2>
          <p className="text-gray-500 text-xs mb-5">
            Only send <strong className="text-white">{selected.currency}</strong> on <strong className="text-white">{selected.network}</strong>. Wrong network = permanent loss.
          </p>
          <div style={{ background: '#090A0F', border: `1px solid ${COIN_COLORS[selected.currency] || '#EAB308'}40`, borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <code className="flex-1 text-sm font-mono break-all" style={{ color: COIN_COLORS[selected.currency] || '#EAB308' }}>{selected.address}</code>
            <button onClick={copy} className="flex-shrink-0 transition-colors">
              {copied ? <CheckCircle size={20} style={{ color: '#10B981' }} /> : <Copy size={20} className="text-gray-400 hover:text-white" />}
            </button>
          </div>
          <div style={{ background: '#EAB30810', border: '1px solid #EAB30830', borderRadius: 10, padding: '12px 16px', color: '#EAB308' }}
            className="flex items-center gap-2 text-xs">
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {t(lang, 'dashboard.minDeposit')}: <strong>$50</strong>. {t(lang, 'dashboard.depositNote')}
          </div>
        </div>
      )}

      {/* Confirm deposit */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
        <h2 className="font-bold mb-5">{t(lang, 'dashboard.confirmDeposit')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t(lang, 'dashboard.amountUsd')} *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" min="50" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                style={{ width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px 14px 32px', fontSize: 14, color: '#fff', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#EAB308'}
                onBlur={e => e.target.style.borderColor = '#1E293B'} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t(lang, 'dashboard.txHash')} *</label>
            <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="Paste your transaction hash here"
              style={{ width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: 'monospace' }}
              onFocus={e => e.target.style.borderColor = '#EAB308'}
              onBlur={e => e.target.style.borderColor = '#1E293B'} />
            <p className="text-gray-600 text-xs mt-1.5">{t(lang, 'dashboard.txHashSub')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t(lang, 'dashboard.proofScreenshot')} <span className="text-gray-600 normal-case">({t(lang, 'dashboard.optional')})</span>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px',
              borderRadius: 12, border: `1px solid ${proofDone ? '#10B98150' : '#1E293B'}`,
              background: proofDone ? '#10B98108' : '#090A0F', cursor: 'pointer', fontSize: 14,
              color: proofDone ? '#10B981' : '#64748b', transition: 'all 0.2s',
            }}>
              {proofUploading ? <Loader2 size={16} className="animate-spin" /> : proofDone ? <CheckCircle size={16} /> : <Upload size={16} />}
              {proofUploading ? 'Uploading...' : proofDone ? 'Screenshot uploaded ✓' : 'Choose screenshot to upload'}
              <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} disabled={proofUploading} />
            </label>
          </div>

          <button onClick={handleSubmit} disabled={submitting || !amount || !txHash || !selected}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, fontWeight: 900, fontSize: 14,
              background: submitting || !amount || !txHash ? '#1E293B' : 'linear-gradient(135deg, #EAB308, #FDE047)',
              color: submitting || !amount || !txHash ? '#475569' : '#090A0F',
              border: 'none', cursor: submitting || !amount || !txHash ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
            }}>
            {submitting ? <><Loader2 size={16} className="animate-spin" />{t(lang, 'dashboard.processing')}</> : <><Upload size={16} />{t(lang, 'dashboard.submitDeposit')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
