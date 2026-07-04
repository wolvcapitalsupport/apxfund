'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, ArrowRight, X } from 'lucide-react'

type MigrationOption = { planId: string; planName: string; minAmount: number; topUpNeeded: number }

// Session-only dismissal — reappears on next login, matches spec.
const DISMISS_KEY = 'migrationBannerDismissed'

export default function MigrationBanner({
  awaitingMigration,
  lockedCapital,
}: {
  awaitingMigration: boolean
  lockedCapital: number
}) {
  const [dismissed, setDismissed] = useState(false)
  const [options, setOptions] = useState<MigrationOption[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (!awaitingMigration) return
    fetch('/api/plans')
      .then(r => r.json())
      .then((plans: { id: string; name: string; minAmount: number; isActive: boolean }[]) => {
        const targets = ['Growth Fund', 'Apex Fund', 'Sovereign Tier']
        const opts = targets
          .map(name => plans.find(p => p.name === name))
          .filter((p): p is NonNullable<typeof p> => !!p)
          .map(p => ({
            planId: p.id,
            planName: p.name,
            minAmount: p.minAmount,
            topUpNeeded: Math.max(0, parseFloat((p.minAmount - lockedCapital).toFixed(2))),
          }))
        setOptions(opts)
      })
      .catch(() => setOptions([]))
  }, [awaitingMigration, lockedCapital])

  if (!awaitingMigration || dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="relative rounded-2xl border px-5 py-5 overflow-hidden" style={{ background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.06), transparent)' }} />
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <Lock size={18} style={{ color: '#a855f7' }} />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a855f7' }} />
            <span className="font-bold text-xs uppercase tracking-wider" style={{ color: '#a855f7' }}>Choose Your Next Plan</span>
          </div>
          <p className="text-gray-300 text-sm mb-1">
            Your Starter Portfolio has completed 2 cycles. Locked capital:{' '}
            <span className="font-black text-white">${lockedCapital.toLocaleString()}</span>
          </p>
          {options.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {options.map(o => (
                <div key={o.planId} className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(10,10,20,0.6)', border: '1px solid rgba(168,85,247,0.25)' }}>
                  <span className="text-gray-400">{o.planName} → </span>
                  <span className="font-bold text-white">
                    {o.topUpNeeded > 0 ? `top up $${o.topUpNeeded.toLocaleString()}` : 'ready now'}
                  </span>
                  <span className="text-gray-600"> (min ${o.minAmount.toLocaleString()})</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-3">
            <Link
              href="/dashboard/plans"
              className="text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 flex-shrink-0"
              style={{ background: '#a855f7', color: '#fff' }}
            >
              Migrate Now <ArrowRight size={13} />
            </Link>
            <a href="/policies" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-300 underline hover:text-purple-200">
              Full terms
            </a>
            <span className="text-xs text-gray-600">This notice reappears on each login</span>
          </div>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all"
      >
        <X size={14} />
      </button>
    </div>
  )
}
