'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, Target, Edit2, X } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Goal {
  targetAmount: number
  targetDate: string
  planName: string
  capital: number
  roiPercent: number
  durationDays: number
}

interface Props {
  investments: any[]
}

function buildProjection(capital: number, roiPercent: number, durationDays: number, cycles: number) {
  const data = []
  let amount = capital
  const today = new Date()

  data.push({
    label: 'Now',
    amount: parseFloat(amount.toFixed(2)),
    profit: 0,
  })

  for (let i = 1; i <= cycles; i++) {
    const cycleProfit = parseFloat(((amount * roiPercent) / 100).toFixed(2))
    amount += cycleProfit
    const date = new Date(today)
    date.setDate(date.getDate() + i * durationDays)
    data.push({
      label: `Cycle ${i}`,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(amount.toFixed(2)),
      profit: parseFloat((amount - capital).toFixed(2)),
    })
  }
  return data
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 10, padding: '12px 16px' }}>
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{payload[0]?.payload?.date || label}</p>
      <p style={{ color: '#EAB308', fontWeight: 900, fontSize: 16, margin: 0 }}>${payload[0]?.value?.toFixed(2)}</p>
      {payload[0]?.payload?.profit > 0 && (
        <p style={{ color: '#10B981', fontSize: 12, margin: '2px 0 0' }}>+${payload[0]?.payload?.profit?.toFixed(2)} profit</p>
      )}
    </div>
  )
}

export default function CompoundingProjector({ investments }: Props) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [cycles, setCycles] = useState(6)
  const [dismissed, setDismissed] = useState(false)

  const activeInv = investments?.find((i: any) => i.status === 'ACTIVE')

  useEffect(() => {
    const stored = localStorage.getItem('apxfund_goal')
    if (stored) {
      try { setGoal(JSON.parse(stored)) }
      catch { localStorage.removeItem('apxfund_goal') }
    }
  }, [])

  if (dismissed || !activeInv) return null

  const capital = goal?.capital || activeInv.amount
  const roiPercent = goal?.roiPercent || activeInv.plan?.roiPercent || 0
  const durationDays = goal?.durationDays || activeInv.plan?.durationDays || 14
  const planName = goal?.planName || activeInv.plan?.name || 'Current Plan'

  const data = buildProjection(capital, roiPercent, durationDays, cycles)
  const finalAmount = data[data.length - 1]?.amount || capital
  const totalProfit = finalAmount - capital
  const totalDays = cycles * durationDays

  const targetAmount = goal?.targetAmount
  const targetReached = targetAmount ? data.find(d => d.amount >= targetAmount) : null

  return (
    <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px', position: 'relative' }}>

      {/* Dismiss */}
      <button onClick={() => setDismissed(true)}
        style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 8, background: '#ffffff08', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
        <X size={14} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#c9a84c18', border: '1px solid #c9a84c30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={16} style={{ color: '#c9a84c' }} />
        </div>
        <div>
          <div className="font-black text-sm">Compounding Projector</div>
          <div className="text-gray-500 text-xs">{planName} · {roiPercent}% every {durationDays} days</div>
        </div>
        {goal && (
          <button onClick={() => { localStorage.removeItem('apxfund_goal'); setGoal(null) }}
            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
            <Edit2 size={11} /> Edit goal
          </button>
        )}
      </div>

      {/* Goal target indicator */}
      {targetAmount && (
        <div style={{ background: targetReached ? '#0d1f0d' : '#1a1a0d', border: `1px solid ${targetReached ? '#10B98140' : '#EAB30840'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-2">
            <Target size={13} style={{ color: targetReached ? '#10B981' : '#EAB308' }} />
            <span className="text-xs font-semibold" style={{ color: targetReached ? '#10B981' : '#EAB308' }}>
              {targetReached ? `Goal reached at ${targetReached.label}` : `Goal: $${targetAmount.toLocaleString()}`}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {targetReached ? '✓ On track' : `Need ${cycles} more cycles`}
          </span>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 160, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#EAB308" strokeWidth={2.5} fill="url(#compGrad)"
              dot={{ fill: '#EAB308', r: 3, strokeWidth: 0 }}
              activeDot={{ fill: '#EAB308', r: 5, stroke: '#EAB30840', strokeWidth: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Starting', value: `$${capital.toLocaleString()}`, color: '#64748b' },
          { label: `After ${cycles} cycles`, value: `$${finalAmount.toFixed(0)}`, color: '#EAB308' },
          { label: 'Total Profit', value: `+$${totalProfit.toFixed(0)}`, color: '#10B981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div className="text-gray-500 text-xs mb-1">{label}</div>
            <div className="font-black text-sm" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Cycle slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Projection cycles</span>
          <span className="text-xs font-bold text-white">{cycles} cycles · {totalDays} days</span>
        </div>
        <input type="range" min={2} max={24} value={cycles} onChange={e => setCycles(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#EAB308' }} />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>2 cycles</span>
          <span>24 cycles</span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        This projection assumes profits are reinvested each cycle. Withdrawing reduces compounding.
      </p>
    </div>
  )
}
