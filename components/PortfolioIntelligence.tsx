'use client'

import { useEffect, useState } from 'react'
import { Brain, RefreshCw } from 'lucide-react'

type FeedData = {
  score?: { score: number; label: string }
  action?: string
  brief?: string
  provider?: { action?: string; brief?: string }
}

export default function PortfolioIntelligence() {
  const [data, setData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/insights/feed')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const score = data?.score?.score ?? 0
  const label = data?.score?.label || 'Stable'

  return (
    <div className="card-dark p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-[#EAB308]" />
          <h3 className="font-bold">Portfolio Intelligence</h3>
        </div>
        <button onClick={load} disabled={loading} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Preparing your latest brief...</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Risk & Opportunity Score</p>
            <p className="text-xl font-black text-[#EAB308]">{score}/100 <span className="text-sm text-gray-400 font-semibold">{label}</span></p>
          </div>

          <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Next Best Action</p>
            <p className="text-sm text-gray-300 leading-relaxed">{data?.action || 'No action available.'}</p>
          </div>

          <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Weekly Brief</p>
            <p className="text-sm text-gray-300 leading-relaxed">{data?.brief || 'No brief available.'}</p>
          </div>

          <p className="text-[11px] text-gray-600">
            Source: action={data?.provider?.action || 'fallback'} | brief={data?.provider?.brief || 'fallback'}
          </p>
        </div>
      )}
    </div>
  )
}
