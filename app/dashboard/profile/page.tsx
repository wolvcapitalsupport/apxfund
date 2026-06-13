'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Phone, Globe, Shield, Edit2, Save, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const { lang } = useLang()
  const { data: session } = useSession()
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error || 'Failed to save')
      else { toast.success('Profile updated!'); setProfile({ ...profile, ...form }); setEditing(false) }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" /></div>

  const inputClass = "w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors"
  const readClass = "w-full bg-[#0a0a14]/50 border border-[#1e1e35]/50 rounded-xl px-4 py-3 text-sm text-gray-300"

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">{t(lang,'dashboard.profileTitle')}</h1>
        <p className="text-gray-500 text-sm">{t(lang,'dashboard.profileSub')}</p>
      </div>

      {/* Avatar card */}
      <div className="card-dark p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center text-[#0a0a14] text-2xl font-black flex-shrink-0">
          {profile?.fullName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-xl">{profile?.fullName}</div>
          <div className="text-gray-500 text-sm">{profile?.email}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${profile?.isActive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
              {profile?.isActive ? 'Active' : 'Suspended'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              profile?.kycStatus === 'APPROVED' ? 'bg-green-400/10 text-green-400' :
              profile?.kycStatus === 'PENDING' ? 'bg-yellow-400/10 text-yellow-400' :
              'bg-gray-400/10 text-gray-400'}`}>
              KYC: {profile?.kycStatus || 'NONE'}
            </span>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 text-sm border border-[#1e1e35] px-4 py-2 rounded-xl hover:border-[#c9a84c]/40 text-gray-400 hover:text-white transition-all">
          <Edit2 size={14} /> {t(lang,'dashboard.edit')}
        </button>
      </div>

      {/* Profile fields */}
      <div className="card-dark p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <User size={13} /> {t(lang,'dashboard.fullName')}
          </label>
          {editing ? <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className={inputClass} />
            : <div className={readClass}>{profile?.fullName}</div>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Mail size={13} /> Email
          </label>
          <div className={readClass}>{profile?.email}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Phone size={13} /> {t(lang,'dashboard.phone')}
          </label>
          {editing ? <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+1 234 567 8900" />
            : <div className={readClass}>{profile?.phone || '—'}</div>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Globe size={13} /> {t(lang,'dashboard.country')}
          </label>
          {editing ? <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className={inputClass} placeholder="United States" />
            : <div className={readClass}>{profile?.country || '—'}</div>}
        </div>

        {editing && (
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl border border-[#1e1e35] text-gray-400 text-sm hover:text-white transition-colors">
              {t(lang,'dashboard.cancel')}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 btn-gold py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" />{t(lang,'dashboard.saving')}</> : <><Save size={14} />{t(lang,'dashboard.saveChanges')}</>}
            </button>
          </div>
        )}
      </div>

      {/* Security info */}
      <div className="card-dark p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Shield size={16} className="text-[#c9a84c]" /> Security</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-3 border-b border-[#1e1e35]">
            <span className="text-gray-500">Email Verified</span>
            {profile?.isEmailVerified ? <CheckCircle size={16} className="text-green-400" /> : <span className="text-red-400 text-xs">Not verified</span>}
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#1e1e35]">
            <span className="text-gray-500">KYC Status</span>
            <span className={`text-xs font-semibold ${profile?.kycStatus === 'APPROVED' ? 'text-green-400' : profile?.kycStatus === 'PENDING' ? 'text-yellow-400' : 'text-gray-400'}`}>
              {profile?.kycStatus || 'NONE'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-500">Member Since</span>
            <span className="text-sm">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
