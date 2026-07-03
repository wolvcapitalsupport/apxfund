'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Receipt, TrendingUp, ArrowDownCircle, ArrowUpCircle, Gift } from 'lucide-react'

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
  DEPOSIT:        { icon: ArrowDownCircle, color: '#60a5fa', bg: '#60a5fa18' },
  WITHDRAWAL:     { icon: ArrowUpCircle,   color: '#f87171', bg: '#f8717118' },
  PROFIT:         { icon: TrendingUp,      color: '#10B981', bg: '#10B98118' },
  REFERRAL:       { icon: Gift,            color: '#EAB308', bg: '#EAB30818' },
  ADJUSTMENT:     { icon: Receipt,         color: '#a78bfa', bg: '#a78bfa18' },
  REFERRAL_BONUS: { icon: Gift,            color: '#EAB308', bg: '#EAB30818' },
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then(d => { setTransactions(d); setLoading(false) })
  }, [])

  const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.type === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">Transaction History</h1>
        <p className="text-gray-500 text-sm">All your deposits, withdrawals, and earnings</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total In',  value: transactions.filter(t => ['DEPOSIT','PROFIT','REFERRAL'].includes(t.type) && t.status === 'APPROVED').reduce((s,t) => s + t.amount, 0), color: '#10B981' },
          { label: 'Total Out', value: transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === 'APPROVED').reduce((s,t) => s + t.amount, 0), color: '#f87171' },
          { label: 'Count',     value: transactions.length, color: '#EAB308', isCount: true },
        ].map(({ label, value, color, isCount }) => (
          <div key={label} style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</div>
            <div className="font-black text-lg" style={{ color }}>
              {isCount ? value : `$${(value as number).toFixed(2)}`}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL','DEPOSIT','WITHDRAWAL','PROFIT','REFERRAL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={filter === f
              ? { background: '#EAB308', color: '#090A0F', border: '1px solid #EAB308', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700 }
              : { background: '#11131E', color: '#64748b', border: '1px solid #1E293B', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p>No transactions found</p>
          </div>
        ) : (
          <div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#090A0F', borderBottom: '1px solid #1E293B' }}>
                  <tr>
                    {['Type', 'Amount', 'Status', 'Date', 'Note'].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx: any) => {
                    const meta = TYPE_META[tx.type] || TYPE_META.ADJUSTMENT
                    const Icon = meta.icon
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #1E293B' }} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={14} style={{ color: meta.color }} />
                            </div>
                            <span className="text-sm font-semibold capitalize">{tx.type.replace(/_/g, ' ').toLowerCase()}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold" style={{ color: ['DEPOSIT','PROFIT','REFERRAL'].includes(tx.type) ? '#10B981' : '#f87171' }}>
                          {['DEPOSIT','PROFIT','REFERRAL'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(tx.status)}`}>{tx.status}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">{formatDate(tx.createdAt)}</td>
                        <td className="px-5 py-4 text-xs text-gray-500 max-w-[200px] truncate">{tx.note || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#1E293B]">
              {filtered.map((tx: any) => {
                const meta = TYPE_META[tx.type] || TYPE_META.ADJUSTMENT
                const Icon = meta.icon
                return (
                  <div key={tx.id} className="flex items-center gap-4 p-4">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm capitalize">{tx.type.replace(/_/g, ' ').toLowerCase()}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{formatDate(tx.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm" style={{ color: ['DEPOSIT','PROFIT','REFERRAL'].includes(tx.type) ? '#10B981' : '#f87171' }}>
                        {['DEPOSIT','PROFIT','REFERRAL'].includes(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>{tx.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
