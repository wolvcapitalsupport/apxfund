'use client'
import Link from 'next/link'
import { TrendingUp, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'

const PLANS = [
  { name: 'Starter Portfolio', min: 200,    roi: 3.5,  days: 7,  profit: 7 },
  { name: 'Growth Fund',       min: 2000,   roi: 12,   days: 14, profit: 240 },
  { name: 'Apex Fund',         min: 30000,  roi: 22,   days: 30, profit: 6600 },
  { name: 'Sovereign Tier',    min: 100000, roi: 38,   days: 30, profit: 38000 },
]

function getNextPlan(balance: number, investments: any[]) {
  const activePlanNames = investments
    .filter(i => i.status === 'ACTIVE')
    .map(i => i.plan?.name)

  const highestActive = PLANS.slice().reverse().find(p => activePlanNames.includes(p.name))
  if (!highestActive) return PLANS[0]

  const currentIdx = PLANS.findIndex(p => p.name === highestActive.name)
  return currentIdx < PLANS.length - 1 ? PLANS[currentIdx + 1] : null
}

export default function UpgradeBanner({ balance, investments }: { balance: number; investments: any[] }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const activePlanNames = investments.filter(i => i.status === 'ACTIVE').map(i => i.plan?.name)
  const highestActive = PLANS.slice().reverse().find(p => activePlanNames.includes(p.name))
  const next = getNextPlan(balance, investments)

  if (!next) return null
  if (!highestActive && investments.length === 0) return null

  const current = highestActive || PLANS[0]
  const canAfford = balance >= next.min
  const shortfall = next.min - balance

  return (
    <div className="relative card-dark border-[#c9a84c]/30 p-4 flex items-center gap-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/5 to-transparent pointer-events-none" />
      <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/15 flex items-center justify-center flex-shrink-0">
        <TrendingUp size={20} className="text-[#c9a84c]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider">Upgrade Available</span>
        </div>
        <p className="text-sm font-semibold text-white">
          {current.name} earns ${current.profit.toLocaleString()} on ${current.min.toLocaleString()}.{' '}
          <span className="text-[#c9a84c]">{next.name} earns ${next.profit.toLocaleString()}</span>
          {' '}in {next.days} days on ${next.min.toLocaleString()}.
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {canAfford
            ? `You have enough balance to upgrade now.`
            : `Deposit $${shortfall.toLocaleString()} more to unlock ${next.name}.`}
        </p>
      </div>
      <Link
        href="/dashboard/plans"
        className="btn-gold text-xs px-4 py-2 flex-shrink-0 flex items-center gap-1"
      >
        {canAfford ? 'Upgrade' : 'Deposit'} <ArrowRight size={14} />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
