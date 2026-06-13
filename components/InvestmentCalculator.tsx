'use client'
import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLang } from '@/lib/useLang'

type Plan = { id: string; name: string; roiPercent: number; durationDays: number; minAmount: number; maxAmount: number }

export default function InvestmentCalculator() {
  const { lang } = useLang()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(p => {
      const list = Array.isArray(p) ? p : []
      setPlans(list)
      if (list.length > 0) setSelectedPlan(list[0])
    })
  }, [])

  const amt = parseFloat(amount) || 0
  const profit = selectedPlan ? (amt * selectedPlan.roiPercent) / 100 : 0
  const total = amt + profit
  const dailyProfit = selectedPlan ? profit / selectedPlan.durationDays : 0

  return (
    <div className="card-dark p-6 border-[#c9a84c]/10">
      <h2 className="font-bold mb-1 flex items-center gap-2">
        <Calculator size={18} className="text-[#c9a84c]" />
        {lang === 'de' ? 'Investitionsrechner' : 'Investment Calculator'}
      </h2>
      <p className="text-gray-500 text-sm mb-5">
        {lang === 'de' ? 'Berechnen Sie Ihre Rendite vor der Investition.' : 'Calculate your return before you invest.'}
      </p>

      <div className="space-y-4">
        {/* Plan selector */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            {lang === 'de' ? 'Plan auswählen' : 'Select Plan'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {plans.map(p => (
              <button key={p.id} onClick={() => setSelectedPlan(p)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${selectedPlan?.id === p.id ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]' : 'border-[#1e1e35] text-gray-400 hover:border-[#c9a84c]/40'}`}>
                {p.name}
                <div className="text-[10px] font-normal opacity-70 mt-0.5">{p.roiPercent}% ROI</div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            {lang === 'de' ? 'Investitionsbetrag (USD)' : 'Investment Amount (USD)'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={selectedPlan ? String(selectedPlan.minAmount) : '100'}
              min={selectedPlan?.minAmount} max={selectedPlan?.maxAmount}
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
          </div>
          {selectedPlan && (
            <p className="text-gray-600 text-xs mt-1">Min: ${selectedPlan.minAmount} · Max: ${selectedPlan.maxAmount}</p>
          )}
        </div>

        {/* Results */}
        {amt > 0 && selectedPlan && (
          <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-4 space-y-3">
            {[
              { label: lang === 'de' ? 'Sie investieren' : 'You Invest', value: formatCurrency(amt), color: 'text-white', icon: DollarSign },
              { label: lang === 'de' ? 'Täglicher Gewinn' : 'Daily Profit', value: `+${formatCurrency(dailyProfit)}`, color: 'text-blue-400', icon: TrendingUp },
              { label: lang === 'de' ? 'Gesamtgewinn' : 'Total Profit', value: `+${formatCurrency(profit)}`, color: 'text-green-400', icon: TrendingUp },
              { label: lang === 'de' ? 'Sie erhalten zurück' : 'You Get Back', value: formatCurrency(total), color: 'text-[#c9a84c]', icon: DollarSign },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Icon size={13} className={color} />{label}
                </div>
                <span className={`font-black text-sm ${color}`}>{value}</span>
              </div>
            ))}
            <div className="border-t border-[#1e1e35] pt-3 mt-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{lang === 'de' ? 'Laufzeit' : 'Duration'}</span>
                <span>{selectedPlan.durationDays} {lang === 'de' ? 'Tage' : 'days'}</span>
              </div>
            </div>
          </div>
        )}

        {amt > 0 && (
          <a href="/dashboard/plans"
            className="btn-gold w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <TrendingUp size={15} />
            {lang === 'de' ? 'Jetzt investieren' : 'Invest Now'}
          </a>
        )}
      </div>
    </div>
  )
}
