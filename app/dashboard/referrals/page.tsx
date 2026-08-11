'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'

export default function ReferralDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/referrals')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const copyLink = async () => {
    if (!data?.referralLink) return
    await navigator.clipboard.writeText(data.referralLink)
    toast.success('Referral link copied')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">Referral Dashboard</h1>
        <p className="text-gray-500 text-sm">Track every invited investor and your referral earnings.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <StatCard label="Total Referrals" value={String(data?.totalReferrals || 0)} color="#EAB308" />
        <StatCard label="Earned" value={`$${(data?.totalEarned || 0).toFixed(2)}`} color="#10B981" />
        <StatCard label="Pending" value={`$${(data?.totalPending || 0).toFixed(2)}`} color="#60a5fa" />
      </div>

      <div className="card-dark p-5">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Shareable Link</p>
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[240px] bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-gray-300 truncate">
            {data?.referralLink}
          </div>
          <button onClick={copyLink} className="btn-gold px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <Copy size={14} /> Copy
          </button>
        </div>
      </div>

      <div className="card-dark p-5 overflow-x-auto">
        <h2 className="font-bold mb-4">Your Referred Users</h2>
        {(data?.referrals || []).length === 0 ? (
          <p className="text-sm text-gray-500">No referrals yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[#1e1e35]">
                <th className="py-2">Name</th>
                <th className="py-2">Joined</th>
                <th className="py-2">Status</th>
                <th className="py-2">Earned</th>
                <th className="py-2">Pending</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((row: any) => (
                <tr key={row.id} className="border-b border-[#1e1e35] text-gray-300">
                  <td className="py-2">
                    <div className="font-semibold">{row.fullName}</div>
                    <div className="text-xs text-gray-500">{row.email}</div>
                  </td>
                  <td className="py-2">{new Date(row.joinedAt).toLocaleDateString()}</td>
                  <td className="py-2">{row.status}</td>
                  <td className="py-2 text-[#10B981] font-semibold">${row.earned.toFixed(2)}</td>
                  <td className="py-2 text-[#60a5fa] font-semibold">${row.pending.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card-dark p-4 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
  )
}
