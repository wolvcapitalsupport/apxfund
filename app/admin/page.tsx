'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import {
  Users, DollarSign, ArrowUpCircle, ArrowDownCircle,
  Search, UserCheck, UserX, PlusCircle, Loader2,
  FileCheck, CheckCircle, XCircle, Eye, Clock,
  TrendingUp, Shield, BarChart3, AlertTriangle, X,
  MinusCircle, Wallet, ListOrdered, ChevronRight,
  Receipt, ToggleLeft, ToggleRight, Mail, Edit2, Save,
  Send, Inbox, UserPlus, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'overview' | 'deposits' | 'withdrawals' | 'kyc' | 'users' | 'roi' | 'wallets' | 'email'

// ─────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

function Spinner() {
  return <div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
}

function ReviewModal({ title, subtitle, onClose, onApprove, onReject, loading, children }: {
  title: string; subtitle?: string
  onClose: () => void; onApprove: (n: string) => void; onReject: (n: string) => void
  loading: boolean; children?: React.ReactNode
}) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121f] border border-[#1e1e35] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-[#1e1e35]">
          <div><h3 className="font-bold text-lg">{title}</h3>{subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-white ml-4"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {children}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Admin Note <span className="text-gray-500">(shown to user on rejection)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Optional note..."
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={() => onReject(note)} disabled={loading}
            className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-400/10 text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={16} />} Reject
          </button>
          <button onClick={() => onApprove(note)} disabled={loading}
            className="flex-1 btn-gold py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />} Approve
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// User Detail Drawer — credit / debit / assign investment
// ─────────────────────────────────────────────────────────────────────
function UserDrawer({ userId, onClose, onRefresh }: { userId: string; onClose: () => void; onRefresh: () => void }) {
  const [user, setUser] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<'credit' | 'debit' | 'invest' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Credit / Debit form
  const [adjAmount, setAdjAmount] = useState('')
  const [adjNote, setAdjNote] = useState('')

  // Invest form
  const [investPlanId, setInvestPlanId] = useState('')
  const [investAmount, setInvestAmount] = useState('')
  const [bypassBalance, setBypassBalance] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/detail?userId=${userId}`).then(r => r.json()),
      fetch('/api/plans').then(r => r.json()),
    ]).then(([u, p]) => {
      setUser(u)
      setPlans(Array.isArray(p) ? p : [])
      if (p.length > 0) setInvestPlanId(p[0].id)
      setLoading(false)
    })
  }, [userId])

  const doAction = async () => {
    if (!activeAction) return
    setActionLoading(true)

    let body: any = { userId, action: '' }

    if (activeAction === 'credit') {
      if (!adjAmount || parseFloat(adjAmount) <= 0) { toast.error('Enter a valid amount'); setActionLoading(false); return }
      body = { userId, action: 'creditBalance', amount: parseFloat(adjAmount), note: adjNote }
    } else if (activeAction === 'debit') {
      if (!adjAmount || parseFloat(adjAmount) <= 0) { toast.error('Enter a valid amount'); setActionLoading(false); return }
      body = { userId, action: 'debitBalance', amount: parseFloat(adjAmount), note: adjNote }
    } else if (activeAction === 'invest') {
      if (!investPlanId || !investAmount || parseFloat(investAmount) <= 0) { toast.error('Select a plan and enter amount'); setActionLoading(false); return }
      body = { userId, action: 'assignInvestment', planId: investPlanId, amount: parseFloat(investAmount), bypassBalance }
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
      } else {
        toast.success(data.message)
        setActiveAction(null)
        setAdjAmount(''); setAdjNote(''); setInvestAmount('')
        // Refresh user data
        const updated = await fetch(`/api/admin/users/detail?userId=${userId}`).then(r => r.json())
        setUser(updated)
        onRefresh()
      }
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleActive = async () => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'toggleActive' }),
    })
    if (res.ok) {
      const updated = await fetch(`/api/admin/users/detail?userId=${userId}`).then(r => r.json())
      setUser(updated)
      onRefresh()
      toast.success('User status updated')
    }
  }

  const selectedPlan = plans.find(p => p.id === investPlanId)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-[#12121f] border-l border-[#1e1e35] flex flex-col h-full overflow-hidden shadow-2xl">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e1e35] flex-shrink-0">
          <h2 className="font-bold text-lg">User Management</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Spinner /></div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* User info header */}
            <div className="px-6 py-5 border-b border-[#1e1e35] bg-[#0a0a14]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-[#0a0a14] text-xl font-black flex-shrink-0">
                  {user?.fullName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">{user?.fullName}</div>
                  <div className="text-gray-500 text-sm">{user?.email}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user?.isActive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                      {user?.isActive ? 'Active' : 'Suspended'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user?.kycStatus === 'APPROVED' ? 'bg-green-400/10 text-green-400' :
                      user?.kycStatus === 'PENDING' ? 'bg-yellow-400/10 text-yellow-400' :
                      'bg-gray-400/10 text-gray-400'
                    }`}>KYC: {user?.kycStatus}</span>
                    {user?.role === 'ADMIN' && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400">ADMIN</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
              {user?.role !== 'ADMIN' && (
                  <button onClick={toggleActive}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                      user?.isActive
                        ? 'border-red-500/30 text-red-400 hover:bg-red-400/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-400/10'
                    }`}>
                    {user?.isActive ? <><UserX size={13} /> Suspend</> : <><UserCheck size={13} /> Activate</>}
                  </button>
                )}
                {user?.role !== 'ADMIN' && user?.kycStatus !== 'APPROVED' && (
                  <button onClick={async () => {
                    const res = await fetch('/api/admin/users', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, action: 'forceKycApprove' }),
                    })
                    if (res.ok) {
                      toast.success('KYC force-approved')
                      const updated = await fetch(`/api/admin/users/detail?userId=${userId}`).then(r => r.json())
                      setUser(updated); onRefresh()
                    }
                  }}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-400/10 transition-all">
                    <FileCheck size={13} /> Force KYC ✓
                  </button>
                )}
              </div>
              </div>

              {/* Balance grid */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Balance', value: formatCurrency(user?.balance || 0), color: '#c9a84c' },
                  { label: 'Deposited', value: formatCurrency(user?.totalDeposited || 0), color: '#60a5fa' },
                  { label: 'Profit', value: formatCurrency(user?.totalProfit || 0), color: '#34d399' },
                  { label: 'Withdrawn', value: formatCurrency(user?.totalWithdrawn || 0), color: '#f87171' },
                ].map(s => (
                  <div key={s.label} className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 py-5 border-b border-[#1e1e35]">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Admin Actions</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'credit', label: 'Credit Balance', icon: PlusCircle, color: '#34d399', bg: 'bg-green-400/10 border-green-400/20 hover:bg-green-400/15', active: 'bg-green-400/20 border-green-400/40 text-green-400' },
                  { id: 'debit', label: 'Debit Balance', icon: MinusCircle, color: '#f87171', bg: 'bg-red-400/10 border-red-400/20 hover:bg-red-400/15', active: 'bg-red-400/20 border-red-400/40 text-red-400' },
                  { id: 'invest', label: 'Assign Plan', icon: TrendingUp, color: '#c9a84c', bg: 'bg-[#c9a84c]/10 border-[#c9a84c]/20 hover:bg-[#c9a84c]/15', active: 'bg-[#c9a84c]/20 border-[#c9a84c]/40 text-[#c9a84c]' },
                ].map(btn => {
                  const Icon = btn.icon
                  const isActive = activeAction === btn.id
                  return (
                    <button key={btn.id}
                      onClick={() => setActiveAction(isActive ? null : btn.id as any)}
                      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border text-xs font-semibold transition-all ${isActive ? btn.active : `${btn.bg} text-gray-300`}`}>
                      <Icon size={18} style={{ color: isActive ? undefined : btn.color }} />
                      {btn.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action form panel */}
            {activeAction && (
              <div className="px-6 py-5 border-b border-[#1e1e35] bg-[#0a0a14]">
                {(activeAction === 'credit' || activeAction === 'debit') && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      {activeAction === 'credit' ? <PlusCircle size={15} className="text-green-400" /> : <MinusCircle size={15} className="text-red-400" />}
                      {activeAction === 'credit' ? 'Credit Balance' : 'Debit Balance'}
                      <span className="text-gray-500 font-normal">→ {user?.fullName}</span>
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Amount (USD) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" min="0.01" value={adjAmount} onChange={e => setAdjAmount(e.target.value)}
                          placeholder="0.00" autoFocus
                          className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Reason / Note (shown to user)</label>
                      <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
                        placeholder="e.g. Bonus reward, correction, promotion..."
                        className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
                    </div>
                    {activeAction === 'debit' && adjAmount && (
                      <div className={`text-xs px-3 py-2 rounded-lg ${parseFloat(adjAmount) > user?.balance ? 'bg-red-400/10 text-red-400' : 'bg-[#12121f] text-gray-400'}`}>
                        Current balance: {formatCurrency(user?.balance || 0)}
                        {parseFloat(adjAmount) > user?.balance && ' — insufficient funds to debit this amount'}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => setActiveAction(null)} className="flex-1 py-2.5 rounded-xl border border-[#1e1e35] text-gray-400 text-sm">Cancel</button>
                      <button onClick={doAction} disabled={actionLoading || !adjAmount}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                          activeAction === 'credit' ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-red-500 text-white hover:bg-red-400'
                        }`}>
                        {actionLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                        {activeAction === 'credit' ? `Credit $${adjAmount || '0'}` : `Debit $${adjAmount || '0'}`}
                      </button>
                    </div>
                  </div>
                )}

                {activeAction === 'invest' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp size={15} className="text-[#c9a84c]" />
                      Assign Investment Plan
                      <span className="text-gray-500 font-normal">→ {user?.fullName}</span>
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Select Plan *</label>
                      <select value={investPlanId} onChange={e => { setInvestPlanId(e.target.value); setInvestAmount('') }}
                        className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]">
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.roiPercent}% ROI in {p.durationDays}d (${p.minAmount}–${p.maxAmount})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedPlan && (
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        {[
                          { label: 'ROI', value: `${selectedPlan.roiPercent}%`, color: '#c9a84c' },
                          { label: 'Duration', value: `${selectedPlan.durationDays}d`, color: '#60a5fa' },
                          { label: 'Range', value: `$${selectedPlan.minAmount}+`, color: '#34d399' },
                        ].map(s => (
                          <div key={s.label} className="bg-[#12121f] border border-[#1e1e35] rounded-lg py-2">
                            <div className="text-gray-500 mb-0.5">{s.label}</div>
                            <div className="font-bold" style={{ color: s.color }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">
                        Investment Amount (USD) *
                        {selectedPlan && <span className="text-gray-600 ml-1">Min: ${selectedPlan.minAmount} · Max: ${selectedPlan.maxAmount}</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)}
                          min={selectedPlan?.minAmount} max={selectedPlan?.maxAmount}
                          placeholder={selectedPlan ? String(selectedPlan.minAmount) : '0'}
                          className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
                      </div>
                    </div>

                    {investAmount && selectedPlan && parseFloat(investAmount) > 0 && (
                      <div className="bg-[#12121f] border border-[#1e1e35] rounded-xl p-3 text-xs space-y-2">
                        <div className="flex justify-between text-gray-400">
                          <span>Investment</span><span className="text-white font-bold">{formatCurrency(parseFloat(investAmount))}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Expected Profit</span><span className="text-green-400 font-bold">+{formatCurrency(parseFloat(investAmount) * selectedPlan.roiPercent / 100)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Total Return</span><span className="text-[#c9a84c] font-bold">{formatCurrency(parseFloat(investAmount) * (1 + selectedPlan.roiPercent / 100))}</span>
                        </div>
                      </div>
                    )}

                    {/* Bypass balance toggle */}
                    <div className="flex items-center justify-between bg-[#12121f] border border-[#1e1e35] rounded-xl px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">Bypass Balance Check</div>
                        <div className="text-xs text-gray-500 mt-0.5">Assign investment even if user lacks balance (admin funded)</div>
                      </div>
                      <button onClick={() => setBypassBalance(!bypassBalance)}
                        className={`flex-shrink-0 transition-colors ${bypassBalance ? 'text-[#c9a84c]' : 'text-gray-600'}`}>
                        {bypassBalance ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </div>

                    {!bypassBalance && investAmount && user?.balance < parseFloat(investAmount) && (
                      <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2.5 text-yellow-400 text-xs">
                        <AlertTriangle size={13} /> User balance ({formatCurrency(user?.balance)}) is less than investment amount. Enable bypass or credit balance first.
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setActiveAction(null)} className="flex-1 py-2.5 rounded-xl border border-[#1e1e35] text-gray-400 text-sm">Cancel</button>
                      <button onClick={doAction} disabled={actionLoading || !investAmount || !investPlanId}
                        className="flex-1 btn-gold py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                        {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                        Assign Investment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Investments list */}
            <div className="px-6 py-5 border-b border-[#1e1e35]">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <ListOrdered size={13} /> Investments ({user?.investments?.length || 0})
              </div>
              {user?.investments?.length === 0 ? (
                <p className="text-gray-600 text-xs">No investments yet</p>
              ) : (
                <div className="space-y-2">
                  {user?.investments?.slice(0, 8).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3">
                      <div>
                        <div className="text-sm font-medium">{inv.plan?.name}</div>
                        <div className="text-gray-500 text-xs">{formatDate(inv.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatCurrency(inv.amount)}</div>
                        <div className="text-green-400 text-xs">+{formatCurrency(inv.expectedProfit)}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                          inv.status === 'ACTIVE' ? 'bg-blue-400/10 text-blue-400' :
                          inv.status === 'COMPLETED' ? 'bg-green-400/10 text-green-400' :
                          'bg-gray-400/10 text-gray-400'}`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transactions list */}
            <div className="px-6 py-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <Receipt size={13} /> Recent Transactions
              </div>
              {user?.transactions?.length === 0 ? (
                <p className="text-gray-600 text-xs">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {user?.transactions?.slice(0, 8).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3">
                      <div>
                        <div className="text-sm capitalize font-medium">{tx.type.replace(/_/g, ' ').toLowerCase()}</div>
                        <div className="text-gray-500 text-xs">{formatDate(tx.createdAt)}</div>
                        {tx.note && <div className="text-gray-600 text-xs mt-0.5 max-w-[160px] truncate">{tx.note}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatCurrency(tx.amount)}</div>
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Deposits Tab
// ─────────────────────────────────────────────────────────────────────
function DepositsTab() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [reviewing, setReviewing] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/transactions?type=DEPOSIT&status=${filter}`)
    const data = await res.json()
    setDeposits(data.transactions || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetch_() }, [fetch_])

  const handleReview = async (action: 'approve' | 'reject', note: string) => {
    setActionLoading(true)
    const res = await fetch('/api/admin/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: reviewing.id, action, adminNote: note }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); setReviewing(null); fetch_() } else toast.error(data.error)
    setActionLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === s ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#12121f] border border-[#1e1e35] text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="card-dark overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-40"><Spinner /></div> :
          deposits.length === 0 ? <div className="text-center py-16 text-gray-600"><ArrowDownCircle size={36} className="mx-auto mb-3 opacity-30" /><p>No deposits found</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a14]"><tr>{['User', 'Amount', 'Currency', 'TX Hash', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-[#1e1e35]">
                {deposits.map((d: any) => (
                  <tr key={d.id} className="hover:bg-white/2">
                    <td className="px-5 py-4"><div className="font-medium text-sm">{d.user?.fullName}</div><div className="text-gray-500 text-xs">{d.user?.email}</div></td>
                    <td className="px-5 py-4 font-bold text-[#c9a84c] text-sm">{formatCurrency(d.amount)}</td>
                    <td className="px-5 py-4 text-sm text-gray-300">{d.currency}</td>
                    <td className="px-5 py-4"><code className="text-xs text-gray-400 bg-[#0a0a14] px-2 py-1 rounded">{d.txHash ? `${d.txHash.slice(0, 14)}…` : '—'}</code></td>
                    <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-4">
                      {d.status === 'PENDING' ? (
                        <button onClick={() => setReviewing(d)} className="flex items-center gap-1.5 text-xs bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1.5 rounded-lg hover:bg-[#c9a84c]/20 transition-all">
                          <Eye size={12} /> Review
                        </button>
                      ) : <span className="text-gray-600 text-xs">{d.adminNote || '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {reviewing && (
        <ReviewModal title={`Review Deposit — ${formatCurrency(reviewing.amount)}`} subtitle={`From ${reviewing.user?.fullName}`}
          onClose={() => setReviewing(null)} onApprove={n => handleReview('approve', n)} onReject={n => handleReview('reject', n)} loading={actionLoading}>
          <div className="bg-[#0a0a14] rounded-xl p-4 space-y-2.5 text-sm">
            {[['User', reviewing.user?.fullName], ['Amount', formatCurrency(reviewing.amount)], ['Currency', reviewing.currency], ['TX Hash', reviewing.txHash || 'N/A'], ['Submitted', formatDate(reviewing.createdAt)]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          {reviewing.proofImageUrl && <a href={reviewing.proofImageUrl} target="_blank" rel="noopener noreferrer" className="text-[#c9a84c] text-xs underline">View proof image ↗</a>}
        </ReviewModal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Withdrawals Tab
// ─────────────────────────────────────────────────────────────────────
function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [reviewing, setReviewing] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/transactions?type=WITHDRAWAL&status=${filter}`)
    const data = await res.json()
    setWithdrawals(data.transactions || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetch_() }, [fetch_])

  const handleReview = async (action: 'approve' | 'reject', note: string) => {
    setActionLoading(true)
    const res = await fetch('/api/admin/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: reviewing.id, action, adminNote: note }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); setReviewing(null); fetch_() } else toast.error(data.error)
    setActionLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-400 text-xs"><strong>Important:</strong> Approving means you have already sent the crypto. Rejecting refunds the user&apos;s balance automatically.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === s ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#12121f] border border-[#1e1e35] text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="card-dark overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-40"><Spinner /></div> :
          withdrawals.length === 0 ? <div className="text-center py-16 text-gray-600"><ArrowUpCircle size={36} className="mx-auto mb-3 opacity-30" /><p>No withdrawals found</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a14]"><tr>{['User', 'Amount', 'Currency', 'Wallet', 'Status', 'Date', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-[#1e1e35]">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-white/2">
                    <td className="px-5 py-4"><div className="font-medium text-sm">{w.user?.fullName}</div><div className="text-gray-500 text-xs">{w.user?.email}</div></td>
                    <td className="px-5 py-4 font-bold text-orange-400 text-sm">{formatCurrency(w.amount)}</td>
                    <td className="px-5 py-4 text-sm text-gray-300">{w.currency}</td>
                    <td className="px-5 py-4"><code className="text-xs text-gray-400 max-w-[120px] block truncate">{w.walletAddress || '—'}</code></td>
                    <td className="px-5 py-4"><StatusBadge status={w.status} /></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(w.createdAt)}</td>
                    <td className="px-5 py-4">
                      {w.status === 'PENDING' ? (
                        <button onClick={() => setReviewing(w)} className="flex items-center gap-1.5 text-xs bg-orange-400/10 text-orange-400 border border-orange-400/30 px-3 py-1.5 rounded-lg hover:bg-orange-400/20 transition-all">
                          <Eye size={12} /> Review
                        </button>
                      ) : <span className="text-gray-600 text-xs">{w.adminNote || '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {reviewing && (
        <ReviewModal title={`Review Withdrawal — ${formatCurrency(reviewing.amount)}`} subtitle={`${reviewing.user?.fullName} · ${reviewing.currency}`}
          onClose={() => setReviewing(null)} onApprove={n => handleReview('approve', n)} onReject={n => handleReview('reject', n)} loading={actionLoading}>
          <div className="bg-[#0a0a14] rounded-xl p-4 space-y-2.5 text-sm">
            {[['User', reviewing.user?.fullName], ['Amount', formatCurrency(reviewing.amount)], ['Currency', reviewing.currency], ['Wallet', reviewing.walletAddress], ['Requested', formatDate(reviewing.createdAt)]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between items-start gap-2"><span className="text-gray-500 flex-shrink-0">{l}</span><span className="font-medium text-right break-all">{v}</span></div>
            ))}
          </div>
        </ReviewModal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// KYC Tab
// ─────────────────────────────────────────────────────────────────────
function KycTab() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [reviewing, setReviewing] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/kyc?status=${filter}`)
    const data = await res.json()
    setSubmissions(data.submissions || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetch_() }, [fetch_])

  const handleReview = async (action: 'approve' | 'reject', note: string) => {
    setActionLoading(true)
    const res = await fetch('/api/admin/kyc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: reviewing.id, action, adminNote: note }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); setReviewing(null); fetch_() } else toast.error(data.error)
    setActionLoading(false)
  }

  const KYC_COLOR: Record<string, string> = { APPROVED: 'text-green-400 bg-green-400/10', PENDING: 'text-yellow-400 bg-yellow-400/10', REJECTED: 'text-red-400 bg-red-400/10', NONE: 'text-gray-400 bg-gray-400/10' }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === s ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#12121f] border border-[#1e1e35] text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="card-dark overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-40"><Spinner /></div> :
          submissions.length === 0 ? <div className="text-center py-16 text-gray-600"><FileCheck size={36} className="mx-auto mb-3 opacity-30" /><p>No KYC submissions</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a14]"><tr>{['User', 'Doc Type', 'Doc Number', 'Status', 'Submitted', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-[#1e1e35]">
                {submissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-white/2">
                    <td className="px-5 py-4"><div className="font-medium text-sm">{s.user?.fullName}</div><div className="text-gray-500 text-xs">{s.user?.email}</div></td>
                    <td className="px-5 py-4 text-sm text-gray-300 capitalize">{s.documentType.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4"><code className="text-xs text-gray-400">{s.documentNumber}</code></td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${KYC_COLOR[s.status]}`}>{s.status}</span></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-4">
                      {s.status === 'PENDING' ? (
                        <button onClick={() => setReviewing(s)} className="flex items-center gap-1.5 text-xs bg-blue-400/10 text-blue-400 border border-blue-400/30 px-3 py-1.5 rounded-lg hover:bg-blue-400/20">
                          <Eye size={12} /> Review
                        </button>
                      ) : <span className="text-gray-600 text-xs">{s.adminNote || '—'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {reviewing && (
        <ReviewModal title="Review KYC Submission" subtitle={`${reviewing.user?.fullName} · ${reviewing.documentType?.replace(/_/g, ' ') ?? ''}`}
          onClose={() => setReviewing(null)} onApprove={n => handleReview('approve', n)} onReject={n => handleReview('reject', n)} loading={actionLoading}>
          <div className="bg-[#0a0a14] rounded-xl p-4 space-y-2 text-sm">
            {[['Name', reviewing.user?.fullName], ['Email', reviewing.user?.email], ['Document', reviewing.documentType?.replace(/_/g, ' ') ?? ''], ['Number', reviewing.documentNumber]].map(([l, v]) => (
              <div key={l as string} className="flex justify-between"><span className="text-gray-500">{l}</span><span>{v}</span></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Front', url: reviewing.frontImageUrl }, { label: 'Back', url: reviewing.backImageUrl }, { label: 'Selfie', url: reviewing.selfieUrl }].filter(i => i.url).map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="block bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-3 text-center hover:border-[#c9a84c]/40 transition-all">
                <div className="text-xs text-gray-500 mb-1">{label}</div><div className="text-[#c9a84c] text-xs">View ↗</div>
              </a>
            ))}
          </div>
        </ReviewModal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Users Tab — with drawer
// ─────────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const fetch_ = useCallback(async (q = '') => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?search=${q}`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const KYC_COLOR: Record<string, string> = { APPROVED: 'text-green-400', PENDING: 'text-yellow-400', REJECTED: 'text-red-400', NONE: 'text-gray-500' }

  return (
    <div className="space-y-5">
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => fetch_(search)} />}
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch_(search)}
            placeholder="Search by name or email..."
            className="w-full bg-[#12121f] border border-[#1e1e35] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
        </div>
        <button onClick={() => fetch_(search)} className="btn-gold text-xs px-5 py-2.5 rounded-xl">Search</button>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 flex-shrink-0">
          <UserPlus size={13} /> Create User
        </button>
      </div>
      <div className="card-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e35] text-xs text-gray-500">Showing {users.length} of {total} users</div>
        {loading ? <div className="flex items-center justify-center h-40"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a14]"><tr>{['User', 'Balance', 'Deposited', 'KYC', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-[#1e1e35]">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-white/2">
                    <td className="px-5 py-4"><div className="font-medium text-sm">{u.fullName}</div><div className="text-gray-500 text-xs">{u.email}</div>{u.role === 'ADMIN' && <span className="text-purple-400 text-xs font-bold">ADMIN</span>}</td>
                    <td className="px-5 py-4 font-bold text-[#c9a84c] text-sm">{formatCurrency(u.balance)}</td>
                    <td className="px-5 py-4 text-sm text-gray-300">{formatCurrency(u.totalDeposited)}</td>
                    <td className="px-5 py-4"><span className={`text-xs font-semibold ${KYC_COLOR[u.kycStatus || 'NONE']}`}>{u.kycStatus || 'NONE'}</span></td>
                    <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></td>
                    <td className="px-5 py-4 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setDrawerUserId(u.id)}
                        className="flex items-center gap-1.5 text-xs bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1.5 rounded-lg hover:bg-[#c9a84c]/20 transition-all">
                        <Wallet size={12} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {drawerUserId && (
        <UserDrawer userId={drawerUserId} onClose={() => setDrawerUserId(null)} onRefresh={() => fetch_(search)} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ROI Tab
// ─────────────────────────────────────────────────────────────────────
function RoiTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    fetch('/api/admin/roi-logs').then(r => r.json()).then(d => { setLogs(d.logs || []); setLoading(false) })
  }, [])

  const triggerManual = async () => {
    setTriggering(true)
    try {
      const res = await fetch('/api/cron/process-roi', { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-trigger'}` } })
      const data = await res.json()
      if (res.ok) toast.success(`ROI run: ${data.investmentsDone} processed · $${data.totalProfitPaid?.toFixed(2)} paid`)
      else toast.error('ROI trigger failed — check server logs')
    } catch { toast.error('Failed to trigger ROI engine') }
    setTriggering(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h3 className="font-bold">ROI Engine Logs</h3><p className="text-gray-500 text-sm">Runs hourly via Vercel Cron. Each row = one run.</p></div>
        <button onClick={triggerManual} disabled={triggering} className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-60">
          {triggering ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />} Trigger Manual Run
        </button>
      </div>
      <div className="card-dark overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-40"><Spinner /></div> :
          logs.length === 0 ? <div className="text-center py-16 text-gray-600"><BarChart3 size={36} className="mx-auto mb-3 opacity-30" /><p>No ROI runs yet</p></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a14]"><tr>{['Run Time', 'Found', 'Processed', 'Total Paid', 'Errors'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-[#1e1e35]">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/2">
                    <td className="px-5 py-4 text-xs text-gray-400">{formatDate(log.processedAt)}</td>
                    <td className="px-5 py-4 text-sm font-medium">{log.investmentsFound}</td>
                    <td className="px-5 py-4 text-sm font-medium text-green-400">{log.investmentsDone}</td>
                    <td className="px-5 py-4 font-bold text-[#c9a84c] text-sm">{formatCurrency(log.totalProfitPaid)}</td>
                    <td className="px-5 py-4">{log.errors ? <span className="text-red-400 text-xs">{log.errors.slice(0, 60)}…</span> : <span className="text-green-400 text-xs">None</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) }) }, [])
  if (loading) return <div className="flex items-center justify-center h-40"><Spinner /></div>
  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: '#c9a84c' },
    { label: 'Total Deposits', value: formatCurrency(stats?.totalDeposits ?? 0), icon: ArrowDownCircle, color: '#60a5fa' },
    { label: 'Total Withdrawals', value: formatCurrency(stats?.totalWithdrawals ?? 0), icon: ArrowUpCircle, color: '#f87171' },
    { label: 'Total Profit Paid', value: formatCurrency(stats?.totalProfit ?? 0), icon: TrendingUp, color: '#34d399' },
    { label: 'Pending Deposits', value: stats?.pendingDeposits ?? 0, icon: Clock, color: '#fbbf24' },
    { label: 'Pending Withdrawals', value: stats?.pendingWithdrawals ?? 0, icon: Clock, color: '#fb923c' },
    { label: 'Pending KYC', value: stats?.pendingKyc ?? 0, icon: FileCheck, color: '#a78bfa' },
    { label: 'Active Investments', value: stats?.activeInvestments ?? 0, icon: BarChart3, color: '#2dd4bf' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-dark p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="text-gray-500 text-xs uppercase tracking-wider">{label}</div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}><Icon size={18} style={{ color }} /></div>
            </div>
            <div className="text-2xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
      {(stats?.pendingDeposits > 0 || stats?.pendingWithdrawals > 0 || stats?.pendingKyc > 0) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-yellow-400" /><span className="font-bold text-yellow-400 text-sm">Action Required</span></div>
          <div className="space-y-1.5 text-sm text-gray-400">
            {stats?.pendingDeposits > 0 && <div>→ <strong className="text-white">{stats.pendingDeposits}</strong> deposit{stats.pendingDeposits !== 1 ? 's' : ''} awaiting approval</div>}
            {stats?.pendingWithdrawals > 0 && <div>→ <strong className="text-white">{stats.pendingWithdrawals}</strong> withdrawal{stats.pendingWithdrawals !== 1 ? 's' : ''} awaiting processing</div>}
            {stats?.pendingKyc > 0 && <div>→ <strong className="text-white">{stats.pendingKyc}</strong> KYC submission{stats.pendingKyc !== 1 ? 's' : ''} awaiting review</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Main Admin Page
// ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard')
  }, [status, session, router])

  if (status === 'loading') return <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" /></div>

  const TABS = [
    { id: 'overview',    label: 'Overview',    icon: BarChart3 },
    { id: 'deposits',    label: 'Deposits',    icon: ArrowDownCircle },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
    { id: 'kyc',         label: 'KYC Review',  icon: FileCheck },
    { id: 'users',       label: 'Users',       icon: Users },
    { id: 'wallets',     label: 'Wallets',     icon: Wallet },
    { id: 'email',       label: 'Email',       icon: Mail },
    { id: 'roi',         label: 'ROI Engine',  icon: TrendingUp },
  ] as const

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="border-b border-[#1e1e35] bg-[#12121f] px-8 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center"><Shield size={18} className="text-purple-400" /></div>
          <div><div className="text-purple-400 text-xs font-semibold uppercase tracking-widest">Admin Panel</div><h1 className="text-xl font-black">APXFund Administration</h1></div>
        </div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white border border-[#1e1e35] px-4 py-2 rounded-xl hover:border-[#c9a84c]/40 transition-all">← Dashboard</a>
      </div>

      <div className="border-b border-[#1e1e35] bg-[#12121f] px-8 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === id ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'deposits' && <DepositsTab />}
        {activeTab === 'withdrawals' && <WithdrawalsTab />}
        {activeTab === 'kyc' && <KycTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'roi' && <RoiTab />}
        {activeTab === 'wallets' && <WalletsTab />}
        {activeTab === 'email' && <EmailTab />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Wallets Tab — admin manages deposit wallet addresses
// ─────────────────────────────────────────────────────────────────────
function WalletsTab() {
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ address: '', label: '', network: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ currency: '', label: '', address: '', network: '' })
  const [adding, setAdding] = useState(false)

  const fetchWallets = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/wallets')
    const data = await res.json()
    setWallets(data.wallets || [])
    setLoading(false)
  }

  useEffect(() => { fetchWallets() }, [])

  const startEdit = (w: any) => {
    setEditingId(w.id)
    setEditForm({ address: w.address, label: w.label, network: w.network, isActive: w.isActive })
  }

  const saveEdit = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/wallets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...editForm }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); setEditingId(null); fetchWallets() }
    else toast.error(data.error)
    setSaving(false)
  }

  const addWallet = async () => {
    if (!addForm.currency || !addForm.label || !addForm.address) return toast.error('All fields required')
    setAdding(true)
    const res = await fetch('/api/admin/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); setShowAdd(false); setAddForm({ currency: '', label: '', address: '', network: '' }); fetchWallets() }
    else toast.error(data.error)
    setAdding(false)
  }

  const deleteWallet = async (id: string) => {
    if (!confirm('Delete this wallet address?')) return
    const res = await fetch('/api/admin/wallets', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Wallet deleted'); fetchWallets() }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Deposit Wallet Addresses</h3>
          <p className="text-gray-500 text-sm mt-0.5">These are the addresses shown to users on the deposit page. Changes apply instantly.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <PlusCircle size={14} /> Add Wallet
        </button>
      </div>

      {showAdd && (
        <div className="card-dark p-6 space-y-4 border-[#c9a84c]/20">
          <h4 className="font-semibold text-sm text-[#c9a84c]">Add New Wallet Address</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'currency', label: 'Currency Code (e.g. BTC)', placeholder: 'BTC' },
              { key: 'label', label: 'Display Label', placeholder: 'Bitcoin (BTC)' },
              { key: 'network', label: 'Network', placeholder: 'Bitcoin Mainnet' },
              { key: 'address', label: 'Wallet Address', placeholder: 'bc1q...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                <input value={(addForm as any)[key]} onChange={e => setAddForm({ ...addForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-[#1e1e35] text-gray-400 text-sm">Cancel</button>
            <button onClick={addWallet} disabled={adding} className="flex-1 btn-gold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              {adding ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />} Add Wallet
            </button>
          </div>
        </div>
      )}

      <div className="card-dark overflow-hidden">
        {loading ? <div className="flex items-center justify-center h-40"><div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" /></div> :
          wallets.length === 0 ? <div className="text-center py-16 text-gray-600"><Wallet size={36} className="mx-auto mb-3 opacity-30" /><p>No wallets configured</p></div> : (
          <div className="divide-y divide-[#1e1e35]">
            {wallets.map(w => (
              <div key={w.id} className="p-5">
                {editingId === w.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-[#c9a84c]">{w.currency}</span>
                      <span className="text-gray-500 text-xs">Editing</span>
                    </div>
                    {[
                      { key: 'label', label: 'Label', placeholder: 'Bitcoin (BTC)' },
                      { key: 'network', label: 'Network', placeholder: 'Bitcoin Mainnet' },
                      { key: 'address', label: 'Address', placeholder: 'bc1q...' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <input value={(editForm as any)[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a84c]" />
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                          className="w-4 h-4 accent-[#c9a84c]" />
                        Active (visible to users)
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl border border-[#1e1e35] text-gray-400 text-sm">Cancel</button>
                        <button onClick={saveEdit} disabled={saving} className="btn-gold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#c9a84c]">{w.currency}</span>
                        <span className="text-gray-300 text-sm">{w.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400">{w.network}</span>
                        {!w.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400">Inactive</span>}
                      </div>
                      <code className="text-xs text-gray-400 font-mono break-all">{w.address}</code>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(w)}
                        className="flex items-center gap-1 text-xs bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30 px-3 py-1.5 rounded-lg hover:bg-[#c9a84c]/20">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => deleteWallet(w.id)}
                        className="flex items-center gap-1 text-xs bg-red-400/10 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-lg hover:bg-red-400/20">
                        <XCircle size={11} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Email Tab — rich email composer with open tracking
// ─────────────────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  {
    name: 'Welcome',
    subject: 'Welcome to APXFund — Your Account is Ready',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#ffffff;padding:40px;border-radius:12px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#c9a84c;font-size:28px;margin:0;">APX<span style="color:#ffffff;">Fund</span></h1>
  </div>
  <h2 style="color:#c9a84c;">Welcome aboard! 🎉</h2>
  <p>Your APXFund account is now active. You can start investing immediately.</p>
  <p>Complete your KYC verification to unlock full platform access and higher investment limits.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://apxfund.xyz/dashboard" style="background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Go to Dashboard</a>
  </div>
  <p style="color:#666;font-size:12px;">APXFund | support@apxfund.xyz</p>
</div>`,
  },
  {
    name: 'Deposit Confirmed',
    subject: 'Your Deposit Has Been Confirmed — APXFund',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#ffffff;padding:40px;border-radius:12px;">
  <h1 style="color:#c9a84c;">APX<span style="color:#ffffff;">Fund</span></h1>
  <h2>✅ Deposit Confirmed</h2>
  <p>Your deposit has been verified and your balance has been credited.</p>
  <p>You can now invest in any available plan that matches your balance.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://apxfund.xyz/dashboard/plans" style="background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">View Investment Plans</a>
  </div>
  <p style="color:#666;font-size:12px;">APXFund | support@apxfund.xyz</p>
</div>`,
  },
  {
    name: 'KYC Approved',
    subject: 'Your Identity Has Been Verified — APXFund',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#ffffff;padding:40px;border-radius:12px;">
  <h1 style="color:#c9a84c;">APX<span style="color:#ffffff;">Fund</span></h1>
  <h2>✅ KYC Verification Approved</h2>
  <p>Your identity verification has been completed successfully.</p>
  <p>You now have full access to all APXFund investment plans and features.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://apxfund.xyz/dashboard" style="background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Explore Plans</a>
  </div>
  <p style="color:#666;font-size:12px;">APXFund | support@apxfund.xyz</p>
</div>`,
  },
  {
    name: 'KYC Rejected',
    subject: 'Action Required: KYC Verification Update — APXFund',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#ffffff;padding:40px;border-radius:12px;">
  <h1 style="color:#c9a84c;">APX<span style="color:#ffffff;">Fund</span></h1>
  <h2>⚠️ KYC Verification — Action Required</h2>
  <p>We were unable to verify your identity with the documents submitted.</p>
  <p>Please re-submit with clearer images ensuring all document details are fully visible.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://apxfund.xyz/dashboard/kyc" style="background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Resubmit Documents</a>
  </div>
  <p style="color:#666;font-size:12px;">APXFund | support@apxfund.xyz</p>
</div>`,
  },
  {
    name: 'Withdrawal Processed',
    subject: 'Your Withdrawal Has Been Processed — APXFund',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#ffffff;padding:40px;border-radius:12px;">
  <h1 style="color:#c9a84c;">APX<span style="color:#ffffff;">Fund</span></h1>
  <h2>💸 Withdrawal Processed</h2>
  <p>Your withdrawal request has been approved and the funds have been sent to your wallet.</p>
  <p>Please allow 1–3 network confirmations for the transfer to fully reflect in your wallet.</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://apxfund.xyz/dashboard/transactions" style="background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">View Transactions</a>
  </div>
  <p style="color:#666;font-size:12px;">APXFund | support@apxfund.xyz</p>
</div>`,
  },
]

function EmailTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [view, setView] = useState<'compose' | 'sent'>('compose')
  const [recipientType, setRecipientType] = useState<'all' | 'custom'>('all')
  const [customEmails, setCustomEmails] = useState('')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  const fetchLogs = async () => {
    setLogsLoading(true)
    const res = await fetch('/api/admin/email')
    const data = await res.json()
    setLogs(data.logs || [])
    setLogsLoading(false)
  }

  useEffect(() => { if (view === 'sent') fetchLogs() }, [view])

  const loadTemplate = (tpl: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(tpl.subject)
    setBodyHtml(tpl.body)
    toast.success(`Template loaded: ${tpl.name}`)
  }

  const sendEmail = async () => {
    if (!subject || !bodyHtml) return toast.error('Subject and body are required')
    if (recipientType === 'custom' && !customEmails.trim()) return toast.error('Enter at least one email')
    setSending(true)

    const payload: any = {
      recipientType,
      subject,
      bodyHtml,
    }

    if (recipientType === 'custom') {
      payload.customEmails = customEmails.split(/[\n,]+/).map((e: string) => e.trim()).filter((e: string) => e.includes('@'))
    }

    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(data.message)
      setSubject(''); setBodyHtml(''); setCustomEmails('')
    } else {
      toast.error(data.error || 'Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[{ id: 'compose', label: 'Compose', icon: Send }, { id: 'sent', label: 'Sent Emails', icon: Inbox }].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === id ? 'bg-[#c9a84c] text-[#0a0a14]' : 'bg-[#12121f] border border-[#1e1e35] text-gray-400 hover:text-white'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {view === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Compose form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card-dark p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Mail size={16} className="text-[#c9a84c]" /> Compose Email</h3>

              {/* Recipient type */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Recipients</label>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All Active Users' },
                    { id: 'custom', label: 'Custom Emails' },
                  ].map(({ id, label }) => (
                    <button key={id} onClick={() => setRecipientType(id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${recipientType === id ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c]' : 'border-[#1e1e35] text-gray-400 hover:text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {recipientType === 'custom' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email addresses <span className="text-gray-600">(one per line or comma-separated — registered or not)</span></label>
                  <textarea value={customEmails} onChange={e => setCustomEmails(e.target.value)} rows={4}
                    placeholder="user@example.com&#10;another@email.com"
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] resize-none font-mono" />
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Your email subject here"
                  className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Email Body (HTML) *</label>
                  <button onClick={() => setPreview(!preview)}
                    className="text-xs text-[#c9a84c] hover:underline">
                    {preview ? 'Edit HTML' : 'Preview'}
                  </button>
                </div>
                {preview ? (
                  <div className="bg-white rounded-xl overflow-hidden" style={{ minHeight: 300 }}>
                    <iframe srcDoc={bodyHtml} className="w-full" style={{ height: 400, border: 'none' }} title="Email preview" />
                  </div>
                ) : (
                  <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} rows={14}
                    placeholder="<div>Your HTML email content here...</div>"
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] resize-none font-mono text-xs" />
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setSubject(''); setBodyHtml('') }}
                  className="px-4 py-2.5 rounded-xl border border-[#1e1e35] text-gray-400 text-sm">
                  Clear
                </button>
                <button onClick={sendEmail} disabled={sending || !subject || !bodyHtml}
                  className="flex-1 btn-gold py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sending ? 'Sending...' : `Send Email${recipientType === 'all' ? ' to All Users' : ''}`}
                </button>
              </div>
            </div>
          </div>

          {/* Templates sidebar */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Quick Templates</div>
            {EMAIL_TEMPLATES.map(tpl => (
              <button key={tpl.name} onClick={() => loadTemplate(tpl)}
                className="w-full text-left card-dark p-4 hover:border-[#c9a84c]/40 transition-all">
                <div className="text-sm font-semibold mb-1">{tpl.name}</div>
                <div className="text-xs text-gray-500 truncate">{tpl.subject}</div>
              </button>
            ))}
            <div className="card-dark p-4 border-blue-400/20">
              <div className="text-xs text-blue-400 font-semibold mb-1 flex items-center gap-1.5"><Eye size={11} /> Open Tracking</div>
              <p className="text-xs text-gray-500">A tracking pixel is automatically embedded in every email. Open status is visible in Sent Emails.</p>
            </div>
          </div>
        </div>
      )}

      {view === 'sent' && (
        <div className="card-dark overflow-hidden">
          {logsLoading ? <div className="flex items-center justify-center h-40"><div className="w-8 h-8 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" /></div> :
            logs.length === 0 ? <div className="text-center py-16 text-gray-600"><Inbox size={36} className="mx-auto mb-3 opacity-30" /><p>No emails sent yet</p></div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a14]">
                  <tr>{['Subject', 'Recipients', 'Sent', 'Open Status', 'Opens'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e35]">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-white/2">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium max-w-[220px] truncate">{log.subject}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">{log.recipients?.length || 0}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{new Date(log.sentAt).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {log.openedAt ? (
                          <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                            <CheckCircle size={12} /> Opened
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Clock size={12} /> Not opened yet
                          </span>
                        )}
                        {log.openedAt && (
                          <div className="text-xs text-gray-600 mt-0.5">{new Date(log.openedAt).toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {log.openCount > 0 ? (
                          <span className="text-[#c9a84c] font-bold text-sm">{log.openCount}×</span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Create User Modal — injected into UsersTab via portal
// ─────────────────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', country: '', phone: '', kycStatus: 'NONE' })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.fullName || !form.email || !form.password) return toast.error('Name, email, and password are required')
    setLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) { toast.success(data.message); onCreated(); onClose() }
    else toast.error(data.error)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121f] border border-[#1e1e35] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#1e1e35]">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#c9a84c]" />
            <h3 className="font-bold text-lg">Create User Account</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: 'fullName', label: 'Full Name *', type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'user@email.com' },
            { key: 'password', label: 'Password *', type: 'password', placeholder: 'Min 8 characters' },
            { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1 555 000 0000' },
            { key: 'country', label: 'Country', type: 'text', placeholder: 'Germany' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">KYC Status</label>
            <select value={form.kycStatus} onChange={e => setForm({ ...form, kycStatus: e.target.value })}
              className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]">
              <option value="NONE">None (default)</option>
              <option value="APPROVED">Approved (skip KYC)</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#1e1e35] text-gray-400 text-sm">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 btn-gold py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Create User
          </button>
        </div>
      </div>
    </div>
  )
}
