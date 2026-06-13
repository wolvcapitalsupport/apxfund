'use client'
import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLang } from '@/lib/useLang'

type DataPoint = { date: string; balance: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-[#c9a84c] font-black text-sm">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function PortfolioChart() {
  const { lang } = useLang()
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7' | '30' | 'all'>('30')

  useEffect(() => {
    fetch('/api/user/portfolio-history?range=' + range)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  const growth = data.length >= 2 ? data[data.length - 1].balance - data[0].balance : 0
  const growthPct = data.length >= 2 && data[0].balance > 0 ? (growth / data[0].balance) * 100 : 0

  if (loading) return (
    <div className="card-dark p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
    </div>
  )

  if (data.length === 0) return null

  return (
    <div className="card-dark p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-[#c9a84c]" />
            {lang === 'de' ? 'Portfolio-Wachstum' : 'Portfolio Growth'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm font-bold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{formatCurrency(growth)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${growth >= 0 ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {[['7', '7D'], ['30', '30D'], ['all', 'All']].map(([val, label]) => (
            <button key={val} onClick={() => { setRange(val as any); setLoading(true) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === val ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#0a0a14] border border-[#1e1e35] text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
          <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="balance" stroke="#c9a84c" strokeWidth={2} fill="url(#portfolioGradient)" dot={false} activeDot={{ r: 4, fill: '#c9a84c' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
