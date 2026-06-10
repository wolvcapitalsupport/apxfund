'use client'
import { useEffect, useState } from 'react'
import { Shield, CheckCircle, Clock, XCircle, Upload, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const DOC_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID Card' },
  { value: 'drivers_license', label: "Driver's License" },
]

const STATUS_CONFIG = {
  NONE: { icon: Shield, color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20', label: 'Not Submitted', message: 'Complete KYC verification to unlock all platform features.' },
  PENDING: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', label: 'Under Review', message: 'Your documents are being reviewed by our compliance team. This typically takes 24–48 hours.' },
  APPROVED: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', label: 'Verified', message: 'Your identity has been verified. You have full access to all platform features.' },
  REJECTED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', label: 'Rejected', message: 'Your KYC was rejected. Please review the reason below and resubmit with clearer documents.' },
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
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onChange(url)
      setDone(true)
      toast.success('File uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}{required && ' *'}</label>
      <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border cursor-pointer text-sm transition-colors ${done ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-[#1e1e35] bg-[#0a0a14] text-gray-400 hover:border-[#c9a84c]'}`}>
        {uploading ? <Loader2 size={16} className="animate-spin" /> : done ? <CheckCircle size={16} /> : <Upload size={16} />}
        {uploading ? 'Uploading...' : done ? 'Uploaded ✓' : 'Choose file to upload'}
        <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={uploading} />
      </label>
    </div>
  )
}

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<string>('NONE')
  const [rejectedNote, setRejectedNote] = useState<string>('')
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ documentType: 'passport', documentNumber: '', frontImageUrl: '', backImageUrl: '', selfieUrl: '' })

  useEffect(() => {
    fetch('/api/kyc').then(r => r.json()).then(d => {
      setKycStatus(d.kycStatus || 'NONE')
      setRejectedNote(d.kycRejectedNote || '')
      setSubmission(d.submission)
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.documentNumber || !form.frontImageUrl || !form.selfieUrl)
      return toast.error('Please upload all required files')
    setSubmitting(true)
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error) } else { toast.success('KYC submitted successfully!'); setKycStatus('PENDING') }
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" /></div>

  const config = STATUS_CONFIG[kycStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.NONE
  const StatusIcon = config.icon

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black mb-1">KYC Verification</h1>
        <p className="text-gray-500 text-sm">Verify your identity to unlock full platform access and higher withdrawal limits.</p>
      </div>

      <div className={`border rounded-2xl p-6 flex items-start gap-4 ${config.bg}`}>
        <StatusIcon size={28} className={`${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className={`font-bold text-lg mb-1 ${config.color}`}>{config.label}</div>
          <p className="text-gray-400 text-sm leading-relaxed">{config.message}</p>
          {kycStatus === 'REJECTED' && rejectedNote && (
            <div className="mt-3 bg-red-400/10 border border-red-400/20 rounded-xl p-3">
              <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">Rejection Reason</div>
              <p className="text-gray-300 text-sm">{rejectedNote}</p>
            </div>
          )}
        </div>
      </div>

      {(kycStatus === 'NONE' || kycStatus === 'REJECTED') && (
        <>
          <div className="card-dark p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-[#c9a84c]" /> Why verify your identity?</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {['Unlock higher withdrawal limits','Access all investment plans','Protect your account from fraud','Required by financial regulations','Faster withdrawal processing','Enhanced account security'].map(b => (
                <div key={b} className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle size={14} className="text-[#c9a84c] flex-shrink-0" />{b}</div>
              ))}
            </div>
          </div>

          <div className="card-dark p-6">
            <h2 className="font-bold mb-1">Submit Your Documents</h2>
            <p className="text-gray-500 text-sm mb-6">Upload clear photos of your ID. Images must be sharp, fully visible, and unedited.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Document Type *</label>
                <select value={form.documentType} onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                  className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#c9a84c]">
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Document Number *</label>
                <input type="text" required value={form.documentNumber} onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))}
                  placeholder="e.g. A12345678"
                  className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c]" />
              </div>
              <FileInput label="Front of Document" required onChange={url => setForm(f => ({ ...f, frontImageUrl: url }))} />
              <FileInput label="Back of Document (if applicable)" onChange={url => setForm(f => ({ ...f, backImageUrl: url }))} />
              <FileInput label="Selfie Holding Document" required onChange={url => setForm(f => ({ ...f, selfieUrl: url }))} />
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-400 text-xs">By submitting, you confirm these are genuine documents and your real identity. False submissions will result in permanent account suspension.</p>
              </div>
              <button type="submit" disabled={submitting} className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : <><Upload size={16} />Submit for Verification</>}
              </button>
            </form>
          </div>
        </>
      )}

      {kycStatus === 'PENDING' && submission && (
        <div className="card-dark p-6">
          <h2 className="font-bold mb-4">Submitted Documents</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-3 border-b border-[#1e1e35]"><span className="text-gray-500">Document Type</span><span className="font-medium capitalize">{submission.documentType.replace(/_/g,' ')}</span></div>
            <div className="flex justify-between py-3 border-b border-[#1e1e35]"><span className="text-gray-500">Document Number</span><span className="font-medium font-mono">{submission.documentNumber}</span></div>
            <div className="flex justify-between py-3 border-b border-[#1e1e35]"><span className="text-gray-500">Submitted On</span><span className="font-medium">{new Date(submission.submittedAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between py-3"><span className="text-gray-500">Status</span><span className="text-yellow-400 font-semibold">Under Review</span></div>
          </div>
        </div>
      )}

      {kycStatus === 'APPROVED' && (
        <div className="card-dark p-6">
          <div className="text-center py-6">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Identity Verified</h2>
            <p className="text-gray-500 text-sm">You have full access to all APXFund features including higher withdrawal limits.</p>
          </div>
        </div>
      )}
    </div>
  )
}
