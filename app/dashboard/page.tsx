'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle, Clock, Copy, CheckCircle, Zap, Shield } from 'lucide-react'
import Link from 'next/link'
import AnimatedNumber from '@/components/AnimatedNumber'
import UpgradeBanner from '@/components/UpgradeBanner'
import MigrationBanner from '@/components/MigrationBanner'
import TickingBalance from '@/components/TickingBalance'
import CompoundingProjector from '@/components/CompoundingProjector'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UserData {
  balance: number
  adminBanner?: string
  adminBannerType?: string
  totalDeposited: number
  totalProfit: number
  totalWithdrawn: number
  referralCode: string
  investments: any[]
  transactions: any[]
  starterCyclesUsed?: number
  awaitingMigration?: boolean
  lockedCapital?: number
}

// ── Build chart data from live transactions ───────────────────────────
function buildChartData(transactions: any[], currentBalance: number) {
  if (!transactions || transactions.length === 0) {
    // Fallback: flat line at current balance
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: parseFloat((currentBalance * (0.85 + i * 0.025)).toFixed(2)),
      }
    })
  }

  // Build running balance from transaction history
  const sorted = [...transactions]
    .filter(t => t.status === 'APPROVED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Group by day
  const byDay: Record<string, number> = {}
  let running = 0

  sorted.forEach(tx => {
    const day = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const delta =
      tx.type === 'DEPOSIT' || tx.type === 'PROFIT' || tx.type === 'REFERRAL' || tx.type === 'ADJUSTMENT'
        ? tx.amount
        : -tx.amount
    running += delta
    byDay[day] = parseFloat(running.toFixed(2))
  })

  const entries = Object.entries(byDay).slice(-14)
  if (entries.length === 0) return []

  return entries.map(([date, balance]) => ({ date, balance }))
}

// ── Custom tooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#11131E] border border-[#1E293B] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-[#EAB308] font-black text-lg">${payload[0]?.value?.toFixed(2)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<UserData | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const referralLink = data?.referralCode && typeof window !== 'undefined'
    ? `${window.location.origin}/ref/${data.referralCode}`
    : ''

  const copyReferral = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" />
    </div>
  )

  const activeCount = data?.investments?.filter((i: any) => i.status === 'ACTIVE').length || 0
  const activeInvestments = data?.investments?.filter((i: any) => i.status === 'ACTIVE') || []
  const totalLocked = activeInvestments.reduce((sum: number, inv: any) => sum + inv.amount, 0)
  const chartData = buildChartData(data?.transactions || [], data?.balance || 0)
  const chartMin = chartData.length > 0 ? Math.min(...chartData.map(d => d.balance)) * 0.95 : 0

  return (
    <div className="space-y-6" style={{ background: '#090A0F', minHeight: '100vh', padding: '0' }}>

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-black mb-1">Portfolio Overview</h1>
        <p className="text-gray-500 text-sm">Your real-time investment dashboard</p>
      </div>

      {/* ── Hero chart card ── */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 20, padding: '24px' }}>
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Current Balance</p>
            <p className="text-4xl font-black" style={{ color: '#EAB308' }}>
              <TickingBalance balance={data?.balance || 0} investments={data?.investments || []} />
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
              <span className="text-xs" style={{ color: '#10B981' }}>
                +${(data?.totalProfit || 0).toFixed(2)} total earned
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <div style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
              <p className="text-gray-500 text-xs mb-1">Locked</p>
              <p className="font-black text-sm text-white">${totalLocked.toLocaleString()}</p>
            </div>
            <div style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
              <p className="text-gray-500 text-xs mb-1">Plans</p>
              <p className="font-black text-sm" style={{ color: '#60a5fa' }}>{activeCount} Active</p>
            </div>
          </div>
        </div>

        {/* Area chart */}
        {chartData.length > 1 ? (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[chartMin, 'auto']}
                  tick={{ fill: '#475569', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#EAB308"
                  strokeWidth={2.5}
                  fill="url(#goldGrad)"
                  dot={{ fill: '#EAB308', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#EAB308', r: 5, stroke: '#EAB30840', strokeWidth: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { date: 'Start', balance: data?.totalDeposited || 0 },
                { date: 'Now', balance: (data?.totalDeposited || 0) + (data?.totalProfit || 0) },
              ]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => '$' + v} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="balance" stroke="#EAB308" strokeWidth={2.5} fill="url(#goldGrad2)"
                  dot={{ fill: '#EAB308', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#EAB308', r: 5, stroke: '#EAB30840', strokeWidth: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Migration banner (Starter Portfolio, 2 cycles complete) ── */}
      <MigrationBanner
        awaitingMigration={!!data?.awaitingMigration}
        lockedCapital={data?.lockedCapital || 0}
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Available Balance', value: data?.balance || 0, icon: DollarSign, color: '#EAB308', isCount: false, sub: 'Ready to invest or withdraw' },
          { label: 'Active Investments', value: activeCount, icon: Zap, color: '#60a5fa', isCount: true, sub: 'Currently earning returns' },
          { label: 'Total Profit', value: data?.totalProfit || 0, icon: TrendingUp, color: '#10B981', isCount: false, sub: 'Lifetime earnings', isTicking: true },
        ].map(({ label, value, icon: Icon, color, isCount, sub, isTicking }) => (
          <div key={label} style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '20px' }}>
            <div className="flex items-start justify-between mb-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs" style={{ color: '#10B981', background: '#10B98115', border: '1px solid #10B98130', borderRadius: 20, padding: '2px 8px' }}>Live</span>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-black" style={{ color }}>
              {isTicking
                ? <TickingBalance balance={value} investments={data?.investments || []} />
                : <AnimatedNumber value={value} prefix={isCount ? '' : '$'} decimals={isCount ? 0 : 2} />
              }
            </p>
            <p className="text-gray-600 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Upgrade banner ── */}
      <UpgradeBanner balance={data?.balance || 0} investments={data?.investments || []} />
      <CompoundingProjector investments={data?.investments || []} />

      {/* ── Admin banner ── */}
      {data?.adminBanner && !bannerDismissed && (
        <div className={`rounded-2xl border px-5 py-4 flex items-start gap-4 relative ${
          data.adminBannerType === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
          data.adminBannerType === 'error' ? 'bg-red-500/10 border-red-500/30' :
          'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            data.adminBannerType === 'warning' ? 'bg-yellow-500/15 border border-yellow-500/30' :
            data.adminBannerType === 'error' ? 'bg-red-500/15 border border-red-500/30' :
            'bg-blue-500/15 border border-blue-500/30'
          }`}>
            <span className="text-base">{data.adminBannerType === 'warning' ? '⚠️' : data.adminBannerType === 'error' ? '🚫' : 'ℹ️'}</span>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${
                data.adminBannerType === 'warning' ? 'bg-yellow-400' :
                data.adminBannerType === 'error' ? 'bg-red-400' : 'bg-blue-400'
              }`} />
              <span className={`font-bold text-xs uppercase tracking-wider ${
                data.adminBannerType === 'warning' ? 'text-yellow-400' :
                data.adminBannerType === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {data.adminBannerType === 'warning' ? 'Important Notice' : data.adminBannerType === 'error' ? 'Account Restricted' : 'Information'}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">{data.adminBanner}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href="mailto:support@apxfund.xyz" className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                data.adminBannerType === 'warning' ? 'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10' :
                data.adminBannerType === 'error' ? 'text-red-400 border-red-400/30 hover:bg-red-400/10' :
                'text-blue-400 border-blue-400/30 hover:bg-blue-400/10'
              }`}>Contact Support →</a>
              <span className="text-xs text-gray-600">This notice reappears on each login</span>
            </div>
          </div>
          <button onClick={() => setBannerDismissed(true)}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle, color: '#60a5fa' },
          { href: '/dashboard/plans', label: 'Invest', icon: TrendingUp, color: '#EAB308' },
          { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: '#10B981' },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 14, padding: '16px 12px', textAlign: 'center', display: 'block', transition: 'border-color 0.2s' }}
            className="hover:border-[#EAB308]/40">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="text-white font-bold text-sm">{label}</div>
          </Link>
        ))}
      </div>

      {/* ── Active investments + transactions ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Active investments */}
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Active Investments</h2>
            <Link href="/dashboard/plans" className="text-xs hover:underline" style={{ color: '#EAB308' }}>+ New</Link>
          </div>
          {activeInvestments.length > 0 ? (
            <div className="space-y-3">
              {activeInvestments.slice(0, 4).map((inv: any) => {
                const now = Date.now()
                const start = new Date(inv.startDate).getTime()
                const end = new Date(inv.endDate).getTime()
                const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000))
                const pct = Math.min(100, Math.round(((now - start) / (end - start)) * 100))
                return (
                  <div key={inv.id} style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '16px' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-sm">{inv.plan?.name}</div>
                        <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {daysLeft}d left · {pct}% complete
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatCurrency(inv.amount)}</div>
                        <div className="text-xs" style={{ color: '#10B981' }}>+{formatCurrency(inv.expectedProfit)}</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', background: '#1E293B', borderRadius: 99, height: 4 }}>
                      <div style={{ width: `${pct}%`, height: 4, borderRadius: 99, background: 'linear-gradient(90deg, #EAB308, #FDE047)', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-600">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active investments</p>
              <Link href="/dashboard/plans" className="text-xs mt-2 inline-block hover:underline" style={{ color: '#EAB308' }}>Start investing →</Link>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-xs hover:underline" style={{ color: '#EAB308' }}>View all</Link>
          </div>
          {data?.transactions && data.transactions.length > 0 ? (
            <div className="space-y-2">
              {data.transactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px' }}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: tx.type === 'PROFIT' || tx.type === 'REFERRAL' ? '#10B98118' : tx.type === 'DEPOSIT' ? '#60a5fa18' : '#f8717118',
                      border: `1px solid ${tx.type === 'PROFIT' || tx.type === 'REFERRAL' ? '#10B98130' : tx.type === 'DEPOSIT' ? '#60a5fa30' : '#f8717130'}`,
                    }}>
                      {tx.type === 'PROFIT' || tx.type === 'REFERRAL'
                        ? <TrendingUp size={14} color="#10B981" />
                        : tx.type === 'DEPOSIT'
                        ? <ArrowDownCircle size={14} color="#60a5fa" />
                        : <ArrowUpCircle size={14} color="#f87171" />
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-xs capitalize">{tx.type.replace(/_/g, ' ')}</div>
                      <div className="text-gray-600 text-xs">{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatCurrency(tx.amount)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-600">
              <p className="text-sm">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Trust bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Security', value: '256-bit SSL', icon: Shield, color: '#60a5fa' },
          { label: 'Payout Speed', value: '< 24 hrs', icon: Zap, color: '#10B981' },
          { label: 'ROI Range', value: '3.5–38%', icon: TrendingUp, color: '#EAB308' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <Icon size={16} style={{ color, margin: '0 auto 6px' }} />
            <div className="font-black text-sm" style={{ color }}>{value}</div>
            <div className="text-gray-600 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Referral ── */}
      {referralLink && (
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '20px' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-sm">Refer & Earn</h2>
              <p className="text-gray-500 text-xs mt-0.5">Share your link and earn referral bonuses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ flex: 1, background: '#090A0F', border: '1px solid #1E293B', borderRadius: 10, padding: '10px 14px' }}
              className="text-xs text-gray-400 truncate">{referralLink}</div>
            <button onClick={copyReferral} className="btn-gold px-4 py-2 text-xs flex items-center gap-1.5 rounded-xl">
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
