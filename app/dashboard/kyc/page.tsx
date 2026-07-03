'use client'
import { useEffect, useState } from 'react'
import { Shield, CheckCircle, Clock, XCircle, Upload, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'

const DOC_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'drivers_license', label: "Driver's License" },
]

const STATUS_CONFIG = {
  NONE:     { icon: Shield,       color: '#64748b', bg: '#64748b15', border: '#64748b25', label: 'Not Submitted',  message: 'Complete KYC verification to unlock all platform features.' },
  PENDING:  { icon: Clock,        color: '#EAB308', bg: '#EAB30815', border: '#EAB30830', label: 'Under Review',   message: 'Your documents are being reviewed. This typically takes 24–48 hours.' },
  APPROVED: { icon: CheckCircle,  color: '#10B981', bg: '#10B98115', border: '#10B98130', label: 'Verified',       message: 'Your identity has been verified. You have full access to all platform features.' },
  REJECTED: { icon: XCircle,      color: '#f87171', bg: '#f8717115', border: '#f8717130', label: 'Rejected',       message: 'Your KYC was rejected. Please review the reason below and resubmit.' },
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

function FileInput({ label, required, onChange }: { label: string; required?: boolean; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadFile(file); onChange(url); setDone(true); toast.success('File uploaded') }
    catch (err: any) { toast.error(err.message || 'Upload failed') }
    finally { setUploading(false) }
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}{required && ' *'}</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', borderRadius: 12, border: `1px solid ${done ? '#10B98150' : '#1E293B'}`, background: done ? '#10B98108' : '#090A0F', cursor: 'pointer', fontSize: 14, color: done ? '#10B981' : '#64748b', transition: 'all 0.2s' }}>
        {uploading ? <Loader2 size={16} className="animate-spin" /> : done ? <CheckCircle size={16} /> : <Upload size={16} />}
        {uploading ? 'Uploading...' : done ? 'Uploaded ✓' : 'Choose file to upload'}
        <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={uploading} />
      </label>
    </div>
  )
}

export default function KycPage() {
  const { lang } = useLang()
  const [kycStatus, setKycStatus] = useState<string>('NONE')
  const [rejectedNote, setRejectedNote] = useState<string>('')
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ documentType: 'passport', documentNumber: '', frontImageUrl: '', backImageUrl: '', selfieUrl: '' })

  useEffect(() => {
    fetch('/api/kyc').then(r => r.json()).then(d => {
      setKycStatus(d.kycStatus || 'NONE'); setRejectedNote(d.kycRejectedNote || ''); setSubmission(d.submission); setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.documentNumber || !form.frontImageUrl || !form.selfieUrl) return toast.error('Please upload all required files')
    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) toast.error(data.error)
      else { toast.success('KYC submitted successfully!'); setKycStatus('PENDING') }
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" /></div>

  const config = STATUS_CONFIG[kycStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.NONE
  const StatusIcon = config.icon

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1">{t(lang, 'dashboard.kycTitle')}</h1>
        <p className="text-gray-500 text-sm">{t(lang, 'dashboard.kycSub')}</p>
      </div>

      {/* Status card */}
      <div style={{ background: config.bg, border: `1px solid ${config.border}`, borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${config.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <StatusIcon size={24} style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg mb-1" style={{ color: config.color }}>{config.label}</div>
          <p className="text-gray-400 text-sm leading-relaxed">{config.message}</p>
          {kycStatus === 'REJECTED' && rejectedNote && (
            <div style={{ marginTop: 12, background: '#f8717115', border: '1px solid #f8717130', borderRadius: 10, padding: '12px 14px' }}>
              <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">Rejection Reason</div>
              <p className="text-gray-300 text-sm">{rejectedNote}</p>
            </div>
          )}
        </div>
      </div>

      {(kycStatus === 'NONE' || kycStatus === 'REJECTED') && (
        <>
          {/* Benefits */}
          <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Shield size={18} style={{ color: '#EAB308' }} /> Why verify your identity?
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {['Unlock higher withdrawal limits','Access all investment plans','Protect your account from fraud','Required by financial regulations','Faster withdrawal processing','Enhanced account security'].map(b => (
                <div key={b} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />{b}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
            <h2 className="font-bold mb-1">{t(lang, 'dashboard.submitDocuments')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t(lang, 'dashboard.submitDocumentsSub')}</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t(lang, 'dashboard.documentType')} *</label>
                <select value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                  style={{ width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#fff', outline: 'none' }}>
                  {DOC_TYPES.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t(lang, 'dashboard.documentNumber')} *</label>
                <input type="text" required value={form.documentNumber} onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))} placeholder="e.g. A12345678"
                  style={{ width: '100%', background: '#090A0F', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#fff', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#EAB308'}
                  onBlur={e => e.target.style.borderColor = '#1E293B'} />
              </div>
              <FileInput label={t(lang, 'dashboard.frontDocument')} required onChange={url => setForm(f => ({ ...f, frontImageUrl: url }))} />
              <FileInput label={t(lang, 'dashboard.backDocument')} onChange={url => setForm(f => ({ ...f, backImageUrl: url }))} />
              <FileInput label={t(lang, 'dashboard.selfieDocument')} required onChange={url => setForm(f => ({ ...f, selfieUrl: url }))} />
              <div style={{ background: '#EAB30810', border: '1px solid #EAB30825', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertTriangle size={14} style={{ color: '#EAB308', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: '#EAB308' }}>By submitting, you confirm these are genuine documents and your real identity. False submissions will result in permanent account suspension.</p>
              </div>
              <button type="submit" disabled={submitting}
                style={{ width: '100%', padding: '16px', borderRadius: 12, background: 'linear-gradient(135deg,#EAB308,#FDE047)', color: '#090A0F', fontWeight: 900, fontSize: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? <><Loader2 size={16} className="animate-spin" />{t(lang, 'dashboard.submitting')}</> : <><Upload size={16} />{t(lang, 'dashboard.submitVerification')}</>}
              </button>
            </form>
          </div>
        </>
      )}

      {kycStatus === 'PENDING' && submission && (
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '24px' }}>
          <h2 className="font-bold mb-4">Submitted Documents</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Document Type',   value: submission.documentType.replace(/_/g,' ') },
              { label: 'Document Number', value: submission.documentNumber },
              { label: 'Submitted On',    value: new Date(submission.submittedAt).toLocaleDateString() },
              { label: 'Status',          value: 'Under Review', highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1E293B' }}>
                <span className="text-gray-500">{label}</span>
                <span className="font-medium capitalize" style={{ color: highlight ? '#EAB308' : '#fff' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {kycStatus === 'APPROVED' && (
        <div style={{ background: '#11131E', border: '1px solid #1E293B', borderRadius: 16, padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10B98115', border: '1px solid #10B98130', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} style={{ color: '#10B981' }} />
          </div>
          <h2 className="text-xl font-bold mb-2">Identity Verified</h2>
          <p className="text-gray-500 text-sm">You have full access to all APXFund features.</p>
        </div>
      )}
    </div>
  )
}
