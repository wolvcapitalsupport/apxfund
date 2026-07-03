'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Phone, Globe, Shield, Edit2, Save, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const { lang } = useLang()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', country: '' })

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(d => {
      setProfile(d)
      setForm({ fullName: d.fullName || '', phone: d.phone || '', country: d.country || '' })
      setLoading(false)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const d = await res.json()
    if (res.ok) { toast.success('Profile updated'); setProfile({ ...profile, ...form }); setEditing(false) }
    else toast.error(d.error || 'Update failed')
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" /></div>

  const KYC_COLORS: Record<string, { color: string; bg: string }> = {
    APPROVED: { color: '#10B981', bg: '#10B98115' },
    PENDING:  { color: '#EAB308', bg: '#EAB30815' },
    REJECTED: { color: '#f87171', bg: '#f8717115' },
    NONE:     { color: '#64748b', bg: '#64748b15' },
  }
  const kyc = KYC_COLORS[profile?.kycStatus] || KYC_COLORS.NONE

  const inputStyle = { width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 14px 14px 44px', fontSize: 14, color: '#fff', outline: 'none' }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account details</p>
      </div>

      {/* Avatar card */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#EAB308,#FDE047)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="text-2xl font-black text-[#090A0F]">{profile?.fullName?.charAt(0)?.toUpperCase() || '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg truncate">{profile?.fullName}</div>
          <div className="text-gray-500 text-sm truncate">{profile?.email}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: kyc.bg, color: kyc.color, fontWeight: 700, border: `1px solid ${kyc.color}30` }}>
              KYC: {profile?.kycStatus || 'NONE'}
            </span>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#EAB30815', color: '#EAB308', fontWeight: 700, border: '1px solid #EAB30830' }}>
              {profile?.role}
            </span>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px', borderRadius: 10, border: '1px solid #1E293B', color: '#64748b', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
          <Edit2 size={12} /> {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Details */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">Account Details</h2>
        {editing ? (
          <div className="space-y-4">
            {[
              { key: 'fullName', label: 'Full Name', icon: User,  placeholder: 'Your full name' },
              { key: 'phone',    label: 'Phone',     icon: Phone, placeholder: '+1 555 000 0000' },
              { key: 'country',  label: 'Country',   icon: Globe, placeholder: 'United States' },
            ].map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#EAB308'}
                    onBlur={e => e.target.style.borderColor = '#1E293B'} />
                </div>
              </div>
            ))}
            <button onClick={save} disabled={saving}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#EAB308,#FDE047)', color: '#090A0F', fontWeight: 900, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.6 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save Changes</>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: profile?.fullName,   icon: User  },
              { label: 'Email',     value: profile?.email,      icon: Mail  },
              { label: 'Phone',     value: profile?.phone || '—', icon: Phone },
              { label: 'Country',   value: profile?.country || '—', icon: Globe },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EAB30812', border: '1px solid #EAB30825', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color: '#EAB308' }} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                  <div className="text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security */}
      <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Security</h2>
        <div style={{ background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#10B98112', border: '1px solid #10B98125', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={14} style={{ color: '#10B981' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Password</div>
            <div className="text-xs text-gray-500">Contact support to reset your password</div>
          </div>
          <CheckCircle size={16} style={{ color: '#10B981' }} />
        </div>
      </div>
    </div>
  )
}
