'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpCircle, Loader2, Lock, TrendingUp, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

export default function WithdrawPage() {
  const { lang } = useLang()
  const [balance, setBalance] = useState(0)
  const [hasCompletedInvestment, setHasCompletedInvestment] = useState(false)
  const [form, setForm] = useState({ amount: '', walletAddress: '', currency: 'BTC' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(d => {
      setBalance(d.balance)
      setHasCompletedInvestment((d.investments || []).some((i: any) => i.status === 'COMPLETED'))
      setLoading(false)
    })
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parseFloat(form.amount) > balance) return toast.error('Insufficient balance')
    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WITHDRAWAL', ...form, amount: parseFloat(form.amount) }),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error)
      else { toast.success('Withdrawal request submitted! Processing within 24 hours.'); setForm({ amount: '', walletAddress: '', currency: 'BTC' }); setBalance(b => b - parseFloat(form.amount)) }
    } catch { toast.error('Request failed') }
    finally { setSubmitting(false) }
  }

  const inputStyle = { width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#fff', outline: 'none' }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" /></div>

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">{t(lang, 'dashboard.withdrawTitle')}</h1>
        <p className="text-gray-500 text-sm">{t(lang, 'dashboard.withdrawPageSub')}</p>
      </div>

      {/* Balance card */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#10B98118', border: '1px solid #10B98130', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowUpCircle size={24} style={{ color: '#10B981' }} />
        </div>
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{t(lang, 'dashboard.availableBalance')}</div>
          <div className="text-3xl font-black" style={{ color: '#EAB308' }}>{formatCurrency(balance)}</div>
        </div>
      </div>

      {!hasCompletedInvestment ? (
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px', space: '16px' }}>
          <div className="flex items-center gap-4 mb-5">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EAB30810', border: '1px solid #EAB30830', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={24} style={{ color: '#EAB308' }} />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: '#EAB308' }}>{t(lang, 'dashboard.withdrawalsLocked')}</h2>
              <p className="text-gray-500 text-xs mt-0.5">{t(lang, 'dashboard.withdrawalsLockedSub')}</p>
            </div>
          </div>
          <div style={{ background: '#EAB30810', border: '1px solid #EAB30820', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <p className="font-semibold text-sm mb-3" style={{ color: '#EAB308' }}>{t(lang, 'dashboard.withdrawHow')}</p>
            <ul className="space-y-2">
              {['withdrawStep1','withdrawStep2','withdrawStep3','withdrawStep4'].map((key, i) => (
                <li key={key} className="flex items-start gap-2 text-xs" style={{ color: '#FDE047' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EAB30830', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i+1}</span>
                  {t(lang, `dashboard.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/dashboard/plans" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#EAB308,#FDE047)', color: '#090A0F', fontWeight: 900, fontSize: 14, textDecoration: 'none' }}>
            <TrendingUp size={16} /> {t(lang, 'dashboard.browseInvestmentPlans')}
          </Link>
        </div>
      ) : (
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { field: 'currency', label: t(lang,'dashboard.currency'), type: 'select', options: [['BTC','Bitcoin (BTC)'],['ETH','Ethereum (ETH)'],['USDT','Tether (USDT)']] },
              { field: 'walletAddress', label: t(lang,'dashboard.walletAddress'), type: 'text', placeholder: t(lang,'dashboard.walletPlaceholder') },
              { field: 'amount', label: t(lang,'dashboard.amountUsd'), type: 'number', placeholder: 'Min: $10' },
            ].map(({ field, label, type, options, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
                {type === 'select' ? (
                  <select value={(form as any)[field]} onChange={set(field)} style={inputStyle}>
                    {(options as string[][]).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <input type={type} required min={type === 'number' ? 10 : undefined} max={type === 'number' ? balance : undefined}
                    value={(form as any)[field]} onChange={set(field)} placeholder={placeholder} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#EAB308'}
                    onBlur={e => e.target.style.borderColor = '#1E293B'} />
                )}
                {field === 'amount' && form.amount && parseFloat(form.amount) > balance && (
                  <p className="text-red-400 text-xs mt-1">Insufficient balance</p>
                )}
              </div>
            ))}

            <div style={{ background: '#60a5fa10', border: '1px solid #60a5fa20', borderRadius: 10, padding: '12px 14px' }}
              className="flex items-center gap-2 text-xs text-blue-400">
              <Shield size={13} style={{ flexShrink: 0 }} />
              Withdrawals are processed within 24 hours to your specified wallet address.
            </div>

            <button type="submit" disabled={submitting || !form.amount || parseFloat(form.amount) > balance}
              style={{ width: '100%', padding: '16px', borderRadius: 12, fontWeight: 900, fontSize: 14, background: 'linear-gradient(135deg,#EAB308,#FDE047)', color: '#090A0F', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? <><Loader2 size={16} className="animate-spin" />{t(lang,'dashboard.processing')}</> : <><ArrowUpCircle size={16} />{t(lang,'dashboard.requestWithdrawal')}</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
