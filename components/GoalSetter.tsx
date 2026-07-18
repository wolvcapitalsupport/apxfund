'use client'
import { useState, useEffect } from 'react'
import { Target, X, TrendingUp, Calendar, DollarSign, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Goal {
  targetAmount: number
  targetDate: string
  planName: string
  capital: number
  roiPercent: number
  durationDays: number
  createdAt: string
}

interface Props {
  planName: string
  capital: number
  roiPercent: number
  durationDays: number
  onClose: () => void
  onSave: (goal: Goal) => void
}

export default function GoalSetter({ planName, capital, roiPercent, durationDays, onClose, onSave }: Props) {
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [projection, setProjection] = useState<{ cycles: number; finalAmount: number; profit: number } | null>(null)

  const cycleProfit = parseFloat(((capital * roiPercent) / 100).toFixed(2))
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + durationDays)
  const minDateStr = minDate.toISOString().split('T')[0]

  useEffect(() => {
    if (!targetAmount || !targetDate) { setProjection(null); return }
    const target = parseFloat(targetAmount)
    if (isNaN(target) || target <= capital) { setProjection(null); return }

    const daysUntilTarget = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)
    const cycles = Math.floor(daysUntilTarget / durationDays)
    let amount = capital
    for (let i = 0; i < cycles; i++) {
      amount += parseFloat(((amount * roiPercent) / 100).toFixed(2))
    }

    setProjection({ cycles, finalAmount: parseFloat(amount.toFixed(2)), profit: parseFloat((amount - capital).toFixed(2)) })
  }, [targetAmount, targetDate, capital, roiPercent, durationDays])

  const save = () => {
    if (!targetAmount || !targetDate) return toast.error('Please set both a target amount and date')
    const goal: Goal = {
      targetAmount: parseFloat(targetAmount),
      targetDate,
      planName,
      capital,
      roiPercent,
      durationDays,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('apxfund_goal', JSON.stringify(goal))
    onSave(goal)
    toast.success('Investment goal saved!')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 20, width: '100%', maxWidth: 480 }} className="shadow-2xl">

        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#c9a84c18', border: '1px solid #c9a84c30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} style={{ color: '#c9a84c' }} />
            </div>
            <div>
              <div className="font-black text-base">Set Your Investment Goal</div>
              <div className="text-gray-500 text-xs mt-0.5">{planName} · {roiPercent}% per {durationDays} days</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#ffffff08', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px' }} className="space-y-5">

          {/* Current position */}
          <div style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="text-gray-500 text-xs mb-0.5">Starting Capital</div>
              <div className="font-black text-lg" style={{ color: '#EAB308' }}>${capital.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-xs mb-0.5">Per Cycle Profit</div>
              <div className="font-black text-lg" style={{ color: '#10B981' }}>+${cycleProfit.toFixed(2)}</div>
            </div>
          </div>

          {/* Goal inputs */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <DollarSign size={11} className="inline mr-1" />Target Amount ($)
            </label>
            <input
              type="number"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder={`e.g. ${(capital * 3).toLocaleString()}`}
              style={{ width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#fff', outline: 'none', fontWeight: 700 }}
              onFocus={e => e.target.style.borderColor = '#EAB308'}
              onBlur={e => e.target.style.borderColor = '#1E293B'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <Calendar size={11} className="inline mr-1" />Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              min={minDateStr}
              onChange={e => setTargetDate(e.target.value)}
              style={{ width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#fff', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#EAB308'}
              onBlur={e => e.target.style.borderColor = '#1E293B'}
            />
          </div>

          {/* Projection result */}
          {projection && (
            <div style={{ background: projection.finalAmount >= parseFloat(targetAmount || '0') ? '#0d1f0d' : '#1f0d0d', border: `1px solid ${projection.finalAmount >= parseFloat(targetAmount || '0') ? '#10B98140' : '#f8717140'}`, borderRadius: 12, padding: '16px' }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: projection.finalAmount >= parseFloat(targetAmount || '0') ? '#10B981' : '#f87171' }}>
                {projection.finalAmount >= parseFloat(targetAmount || '0') ? '✓ Goal Achievable' : '⚠ Goal Needs More Time'}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Cycles</div>
                  <div className="font-black text-lg text-white">{projection.cycles}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Total Profit</div>
                  <div className="font-black text-lg" style={{ color: '#10B981' }}>+${projection.profit.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Final Amount</div>
                  <div className="font-black text-lg" style={{ color: '#EAB308' }}>${projection.finalAmount.toFixed(0)}</div>
                </div>
              </div>
              {projection.finalAmount < parseFloat(targetAmount || '0') && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Extend your target date or increase capital to reach ${parseFloat(targetAmount).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Compounding note */}
          <div style={{ background: '#EAB30808', border: '1px solid #EAB30820', borderRadius: 10, padding: '12px 14px' }}
            className="flex items-start gap-2">
            <TrendingUp size={13} style={{ color: '#EAB308', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: '#EAB308' }}>
              This projection assumes you reinvest all profits each cycle. Withdrawing profits early will reduce your final amount.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'transparent', border: '1px solid #1E293B', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Skip for now
            </button>
            <button onClick={save}
              style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#EAB308,#FDE047)', color: '#090A0F', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Save Goal <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
