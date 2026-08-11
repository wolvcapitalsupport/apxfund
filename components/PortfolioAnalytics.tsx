import { formatCurrency } from '@/lib/utils'

interface Investment {
  id: string
  amount: number
  expectedProfit: number
  status: string
  cycleNumber?: number
  startDate: string
  endDate: string
  plan?: { name?: string }
}

export default function PortfolioAnalytics({ investments }: { investments: Investment[] }) {
  const now = Date.now()
  const completed = investments.filter(i => i.status === 'COMPLETED')
  const active = investments.filter(i => i.status === 'ACTIVE')

  const totalCapital = investments.reduce((sum, i) => sum + i.amount, 0)
  const totalProfit = completed.reduce((sum, i) => sum + i.expectedProfit, 0)
  const allTimeRoi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0

  const avgProgress = active.length > 0
    ? active.reduce((sum, i) => {
        const start = new Date(i.startDate).getTime()
        const end = new Date(i.endDate).getTime()
        const progress = Math.max(0, Math.min(1, (now - start) / (end - start)))
        return sum + progress
      }, 0) / active.length
    : 0

  const nearest = active
    .map(i => ({
      ...i,
      remainingMs: new Date(i.endDate).getTime() - now,
    }))
    .sort((a, b) => a.remainingMs - b.remainingMs)[0]

  const nearestText = nearest
    ? formatRemaining(nearest.remainingMs)
    : 'No active cycle'

  return (
    <div className="card-dark p-5">
      <h3 className="font-bold mb-4">Portfolio Analytics</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="All-Time ROI" value={`${allTimeRoi.toFixed(2)}%`} color="#22c55e" />
        <Stat label="Completed Cycles" value={String(completed.length)} color="#EAB308" />
        <Stat label="Realized Profit" value={formatCurrency(totalProfit)} color="#60a5fa" />
        <Stat label="Nearest Maturity" value={nearestText} color="#f59e0b" />
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Active cycle progress average: <span className="text-gray-300">{(avgProgress * 100).toFixed(1)}%</span>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="font-black" style={{ color }}>{value}</div>
    </div>
  )
}

function formatRemaining(ms: number) {
  if (ms <= 0) return 'Due now'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  return `${days}d ${hours}h`
}
