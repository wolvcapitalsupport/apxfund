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

  const copyReferral = () => {
    if (!data) return
    const link = `${window.location.origin}/auth/register?ref=${data.referralCode}`
    navigator.clipboard.writeText(link)
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
    { label: 'Available Balance', value: formatCurrency(data?.balance || 0), icon: DollarSign, color: '#c9a84c', change: 'Available to invest or withdraw' },
    { label: 'Total Deposited', value: formatCurrency(data?.totalDeposited || 0), icon: ArrowDownCircle, color: '#60a5fa', change: 'All-time deposits' },
    { label: 'Total Profit', value: formatCurrency(data?.totalProfit || 0), icon: TrendingUp, color: '#34d399', change: 'Earnings from investments' },
    { label: 'Total Withdrawn', value: formatCurrency(data?.totalWithdrawn || 0), icon: ArrowUpCircle, color: '#f87171', change: 'All-time withdrawals' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black mb-1">Portfolio Overview</h1>
        <p className="text-gray-500 text-sm">Your real-time investment dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="card-dark p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-black" style={{color}}>{value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: `${color}15`}}>
                <Icon size={20} style={{color}} />
              </div>
            </div>
            <p className="text-gray-600 text-xs">{change}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/deposit', label: 'Make Deposit', sub: 'Fund your account', icon: ArrowDownCircle, color: '#60a5fa' },
          { href: '/dashboard/plans', label: 'Invest Now', sub: 'Choose a plan', icon: TrendingUp, color: '#c9a84c' },
          { href: '/dashboard/withdraw', label: 'Withdraw', sub: 'Cash out earnings', icon: ArrowUpCircle, color: '#34d399' },
        ].map(({ href, label, sub, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="card-dark p-5 flex items-center gap-4 hover:border-[#c9a84c]/40 transition-all group hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${color}15`}}>
              <Icon size={22} style={{color}} />
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
          <div className="flex items-center gap-3 bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3">
            <code className="text-[#c9a84c] text-sm font-mono">{data?.referralCode}</code>
            <button onClick={copyReferral} className="text-gray-400 hover:text-[#c9a84c] transition-colors">
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
