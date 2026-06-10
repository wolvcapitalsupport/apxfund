'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle, Clock, Copy, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface UserData {
  balance: number
  totalDeposited: number
  totalProfit: number
  totalWithdrawn: number
  referralCode: string
  investments: any[]
  transactions: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<UserData | null>(null)
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
      <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
    </div>
  )

  const stats = [
    { label: 'Available Balance', value: formatCurrency(data?.balance || 0), icon: DollarSign, colorClass: 'text-[#c9a84c]', bgClass: 'bg-[#c9a84c]/15', change: 'Available to invest or withdraw' },
    { label: 'Total Deposited', value: formatCurrency(data?.totalDeposited || 0), icon: ArrowDownCircle, colorClass: 'text-[#60a5fa]', bgClass: 'bg-[#60a5fa]/15', change: 'All-time deposits' },
    { label: 'Total Profit', value: formatCurrency(data?.totalProfit || 0), icon: TrendingUp, colorClass: 'text-[#34d399]', bgClass: 'bg-[#34d399]/15', change: 'Earnings from investments' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black mb-1">Portfolio Overview</h1>
        <p className="text-gray-500 text-sm">Your real-time investment dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, colorClass, bgClass, change }) => (
          <div key={label} className="card-dark p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
                <Icon size={20} className={colorClass} />
              </div>
            </div>
            <p className="text-gray-600 text-xs">{change}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/deposit', label: 'Make Deposit', sub: 'Fund your account', icon: ArrowDownCircle, colorClass: 'text-[#60a5fa]', bgClass: 'bg-[#60a5fa]/15' },
          { href: '/dashboard/plans', label: 'Invest Now', sub: 'Choose a plan', icon: TrendingUp, colorClass: 'text-[#c9a84c]', bgClass: 'bg-[#c9a84c]/15' },
          { href: '/dashboard/withdraw', label: 'Withdraw', sub: 'Cash out earnings', icon: ArrowUpCircle, colorClass: 'text-[#34d399]', bgClass: 'bg-[#34d399]/15' },
        ].map(({ href, label, sub, icon: Icon, colorClass, bgClass }) => (
          <Link key={href} href={href}
            className="card-dark p-5 flex items-center gap-4 hover:border-[#c9a84c]/40 transition-all group hover:-translate-y-0.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
              <Icon size={22} className={colorClass} />
            </div>
            <div>
              <div className="font-bold text-sm group-hover:text-[#c9a84c] transition-colors">{label}</div>
              <div className="text-gray-500 text-xs">{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Investments */}
        <div className="card-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Active Investments</h2>
            <Link href="/dashboard/plans" className="text-[#c9a84c] text-xs hover:underline">+ New Investment</Link>
          </div>
          {data?.investments && data.investments.filter(i => i.status === 'ACTIVE').length > 0 ? (
            <div className="space-y-3">
              {data.investments.filter(i => i.status === 'ACTIVE').slice(0, 4).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-[#0a0a14] rounded-xl border border-[#1e1e35]">
                  <div>
                    <div className="font-semibold text-sm">{inv.plan?.name}</div>
                    <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> Due {formatDate(inv.endDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatCurrency(inv.amount)}</div>
                    <div className="text-green-400 text-xs">+{formatCurrency(inv.expectedProfit)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-600">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active investments</p>
              <Link href="/dashboard/plans" className="text-[#c9a84c] text-xs mt-2 inline-block hover:underline">Start investing →</Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card-dark p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-[#c9a84c] text-xs hover:underline">View all</Link>
          </div>
          {data?.transactions && data.transactions.length > 0 ? (
            <div className="space-y-3">
              {data.transactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0a0a14] rounded-xl border border-[#1e1e35]">
                  <div>
                    <div className="font-semibold text-sm capitalize">{tx.type.replace(/_/g,' ')}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{formatDate(tx.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatCurrency(tx.amount)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
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

      {/* Referral card */}
      <div className="card-dark p-6 border-[#c9a84c]/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-bold mb-1">Your Referral Program</h2>
            <p className="text-gray-500 text-sm">Earn up to 15% bonus for every investor you refer</p>
          </div>
          <div className="flex flex-col gap-3 bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Share this link</p>
              <p className="text-sm truncate text-white">
                {loading
                  ? 'Loading your referral link...'
                  : referralLink
                    ? referralLink
                    : 'No referral code found on your account.'}
              </p>
            </div>
            <button onClick={copyReferral} className="text-gray-400 hover:text-[#c9a84c] transition-colors" disabled={!referralLink}>
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          <div className="border-t border-[#1e1e35] pt-3">
            <p className="text-xs text-gray-400 mb-1">Manual referral code</p>
            <code className="text-[#c9a84c] text-sm font-mono">{data?.referralCode}</code>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
