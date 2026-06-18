'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, CheckCircle, Loader2, ChevronRight, Clock, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

type Plan = { id: string; name: string; roiPercent: number; minAmount: number; maxAmount: number; durationDays: number; referralBonus: number; description?: string; features: string[] }
type Investment = { id: string; plan: Plan; amount: number; expectedProfit: number; status: string; startDate: string; endDate: string; completedAt?: string }

export default function PlansPage() {
  const { lang } = useLang()
  const [plans, setPlans] = useState<Plan[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [amount, setAmount] = useState('')
  const [autoReinvest, setAutoReinvest] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'buy' | 'mine'>('buy')

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/investments').then(r => r.json()),
      fetch('/api/user/me').then(r => r.json()),
    ]).then(([p, inv, user]) => {
      setPlans(Array.isArray(p) ? p : [])
      setInvestments(Array.isArray(inv) ? inv : [])
      setBalance(user.balance || 0)
      setLoading(false)
    })
  }, [])

  const handleInvest = async () => {
    if (!selectedPlan || !amount) return
    const amt = parseFloat(amount)
    if (amt < selectedPlan.minAmount) return toast.error(`Minimum is $${selectedPlan.minAmount}`)
    if (amt > selectedPlan.maxAmount) return toast.error(`Maximum is $${selectedPlan.maxAmount}`)
    if (amt > balance) return toast.error(t(lang,'dashboard.insufficientBalance'))
    setSubmitting(true)
    try {
      const res = await fetch('/api/investments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id, amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error)
      else {
        toast.success('Investment created successfully!')
        setBalance(b => b - amt)
        setInvestments(prev => [data.investment, ...prev])
        setSelectedPlan(null); setAutoReinvest(true); setAmount(''); setTab('mine')
      }
    } catch { toast.error('Investment failed') }
    finally { setSubmitting(false) }
  }

  const activeInvestments = investments.filter(i => i.status === 'ACTIVE')
  const completedInvestments = investments.filter(i => i.status === 'COMPLETED')
  const pendingProfit = activeInvestments.reduce((s, i) => s + i.expectedProfit, 0)
  const allTimeProfit = completedInvestments.reduce((s, i) => s + i.expectedProfit, 0)

  const getDayProgress = (inv: Investment) => {
    const start = new Date(inv.startDate).getTime()
    const end = new Date(inv.endDate).getTime()
    const now = Date.now()
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black mb-1">{t(lang,'dashboard.plansTitle')}</h1>
        <p className="text-gray-500 text-sm">{t(lang,'dashboard.plansSub')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['buy', t(lang,'dashboard.buyPlan')], ['mine', t(lang,'dashboard.myInvestments')]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#12121f] border border-[#1e1e35] text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'buy' && (
        <div className="space-y-6">
          {/* Plan cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {plans.map(plan => {
              const isSelected = selectedPlan?.id === plan.id
              return (
                <div key={plan.id} onClick={() => { setSelectedPlan(isSelected ? null : plan); setAmount('') }}
                  className={`card-dark p-6 cursor-pointer transition-all hover:-translate-y-0.5 ${isSelected ? 'border-[#c9a84c]/60 bg-[#c9a84c]/5' : 'hover:border-[#c9a84c]/30'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-lg">{plan.name}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{plan.description}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-[#c9a84c] bg-[#c9a84c]' : 'border-[#1e1e35]'}`}>
                      {isSelected && <CheckCircle size={16} className="text-[#0a0a14]" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'ROI', value: `${plan.roiPercent}%`, color: '#c9a84c' },
                      { label: t(lang,'dashboard.duration'), value: `${plan.durationDays}d`, color: '#60a5fa' },
                      { label: t(lang,'dashboard.minDeposit'), value: `$${plan.minAmount}`, color: '#34d399' },
                      { label: t(lang,'dashboard.referralBonus'), value: `${plan.referralBonus}%`, color: '#a78bfa' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#0a0a14] rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                        <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.slice(0, 3).map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle size={12} className="text-[#c9a84c] flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-[#1e1e35] text-center">
                    <span className={`text-xs font-semibold ${isSelected ? 'text-[#c9a84c]' : 'text-gray-500'}`}>
                      {isSelected ? t(lang,'dashboard.selected') : t(lang,'dashboard.selectPlan')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Investment form */}
          {selectedPlan && (
            <div className="card-dark p-6 border-[#c9a84c]/20 space-y-5">
              <h2 className="font-bold">{t(lang,'dashboard.reviewConfirm')}</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t(lang,'dashboard.investmentAmount')}
                  <span className="text-gray-500 ml-2 text-xs">Min: ${selectedPlan.minAmount} · Max: ${selectedPlan.maxAmount}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    min={selectedPlan.minAmount} max={Math.min(selectedPlan.maxAmount, balance)}
                    placeholder={String(selectedPlan.minAmount)}
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-4 space-y-2.5 text-sm">
                  {[
                    [t(lang,'dashboard.investmentAmount'), formatCurrency(parseFloat(amount)), 'text-white'],
                    [t(lang,'dashboard.expectedProfit'), `+${formatCurrency(parseFloat(amount) * selectedPlan.roiPercent / 100)}`, 'text-green-400'],
                    [t(lang,'dashboard.totalReturn'), formatCurrency(parseFloat(amount) * (1 + selectedPlan.roiPercent / 100)), 'text-[#c9a84c]'],
                    [t(lang,'dashboard.duration'), `${selectedPlan.durationDays} days`, 'text-blue-400'],
                    [t(lang,'dashboard.balanceAfter'), formatCurrency(balance - parseFloat(amount)), parseFloat(amount) > balance ? 'text-red-400' : 'text-gray-300'],
                  ].map(([label, value, color]) => (
                    <div key={label as string} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {parseFloat(amount) > balance && (
                <p className="text-red-400 text-xs">{t(lang,'dashboard.insufficientBalance')}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setSelectedPlan(null); setAutoReinvest(true); setAmount('') }}
                  className="flex-1 py-3 rounded-xl border border-[#1e1e35] text-gray-400 text-sm hover:text-white transition-colors">
                  {t(lang,'dashboard.cancel')}
                </button>
                <button onClick={handleInvest} disabled={submitting || !amount || parseFloat(amount) > balance || parseFloat(amount) < selectedPlan.minAmount}
                  className="flex-1 btn-gold py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <><Loader2 size={14} className="animate-spin" />{t(lang,'dashboard.processing')}</> : <><TrendingUp size={14} />{t(lang,'dashboard.confirmInvestment')}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t(lang,'dashboard.activeInvestmentsCount'), value: activeInvestments.length, color: '#c9a84c' },
              { label: t(lang,'dashboard.pendingProfit'), value: formatCurrency(pendingProfit), color: '#34d399' },
              { label: t(lang,'dashboard.allTimeProfit'), value: formatCurrency(allTimeProfit), color: '#60a5fa' },
            ].map(s => (
              <div key={s.label} className="card-dark p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {investments.length === 0 ? (
            <div className="card-dark p-12 text-center text-gray-600">
              <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-2">{t(lang,'dashboard.noInvestmentsYet')}</p>
              <p className="text-xs text-gray-600 mb-4">{t(lang,'dashboard.noInvestmentsSub')}</p>
              <button onClick={() => setTab('buy')} className="btn-gold px-5 py-2 rounded-xl text-sm">{t(lang,'dashboard.browsePlans')}</button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active */}
              {activeInvestments.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">{t(lang,'dashboard.activeInvestmentsTab')}</h3>
                  <div className="space-y-3">
                    {activeInvestments.map(inv => {
                      const progress = getDayProgress(inv)
                      return (
                        <div key={inv.id} className="card-dark p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-bold">{inv.plan?.name}</div>
                              <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                                <Clock size={11} /> {t(lang,'dashboard.maturesOn')} {formatDate(inv.endDate)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-[#c9a84c]">{formatCurrency(inv.amount)}</div>
                              <div className="text-green-400 text-xs">+{formatCurrency(inv.expectedProfit)} {t(lang,'dashboard.expectedReturn')}</div>
                            </div>
                          </div>
                          <div className="h-1.5 bg-[#1e1e35] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8cc7a] rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>{Math.round(progress)}% {t(lang,'dashboard.complete')}</span>
                            <span>{Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / 86400000)} days {t(lang,'dashboard.remaining')}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedInvestments.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3">{t(lang,'dashboard.completedTab')}</h3>
                  <div className="space-y-3">
                    {completedInvestments.map(inv => (
                      <div key={inv.id} className="card-dark p-5 opacity-75">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm">{inv.plan?.name}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{t(lang,'dashboard.matured')} {formatDate(inv.completedAt || inv.endDate)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(inv.amount)}</div>
                            <div className="text-green-400 text-xs">+{formatCurrency(inv.expectedProfit)} {t(lang,'dashboard.fromCompleted')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
