'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Phone, Globe, Shield, Edit2, Save, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', country: '' })

  useEffect(() => {
    fetch('/api/user/me')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setForm({ fullName: d.fullName || '', phone: d.phone || '', country: d.country || '' })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (res.ok) { toast.success('Profile updated'); setData({ ...data, ...form }); setEditing(false) }
    else toast.error(d.error || 'Update failed')
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
    </div>
  )

  const KYC_COLORS: Record<string, string> = {
    APPROVED: 'text-green-400 bg-green-400/10 border-green-400/20',
    PENDING:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    REJECTED: 'text-red-400 bg-red-400/10 border-red-400/20',
    NONE:     'text-gray-400 bg-gray-400/10 border-gray-400/20',
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account details</p>
      </div>

      {/* Avatar + name card */}
      <div className="card-dark p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-black text-[#0a0a14]">
            {data?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg truncate">{data?.fullName}</div>
          <div className="text-gray-500 text-sm truncate">{data?.email}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${KYC_COLORS[data?.kycStatus] || KYC_COLORS.NONE}`}>
              KYC: {data?.kycStatus || 'NONE'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full border border-[#c9a84c]/30 text-[#c9a84c] bg-[#c9a84c]/10 font-semibold">
              {data?.role}
            </span>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs border border-[#1e1e35] hover:border-[#c9a84c]/50 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all flex-shrink-0">
          <Edit2 size={12} /> {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Details */}
      <div className="card-dark p-6 space-y-5">
        <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500">Account Details</h2>

        {editing ? (
          <div className="space-y-4">
            {[
              { key: 'fullName', label: 'Full Name', icon: User,  type: 'text', placeholder: 'Your full name' },
              { key: 'phone',    label: 'Phone',     icon: Phone, type: 'text', placeholder: '+1 555 000 0000' },
              { key: 'country',  label: 'Country',   icon: Globe, type: 'text', placeholder: 'United States' },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>
              </div>
            ))}
            <button onClick={save} disabled={saving}
              className="w-full btn-gold py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Full Name', value: data?.fullName,  icon: User  },
              { label: 'Email',     value: data?.email,     icon: Mail  },
              { label: 'Phone',     value: data?.phone || '—', icon: Phone },
              { label: 'Country',   value: data?.country || '—', icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 p-4 bg-[#0a0a14] rounded-xl border border-[#1e1e35]">
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-[#c9a84c]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                  <div className="text-sm font-medium truncate">{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card-dark p-6">
        <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">Security</h2>
        <div className="flex items-center gap-4 p-4 bg-[#0a0a14] rounded-xl border border-[#1e1e35]">
          <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center flex-shrink-0">
            <Shield size={14} className="text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium">Password</div>
            <div className="text-xs text-gray-500">Contact support to reset your password</div>
          </div>
          <div className="ml-auto">
            <CheckCircle size={16} className="text-green-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
