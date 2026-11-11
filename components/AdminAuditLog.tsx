'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileSearch, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type AuditRow = {
  id: string
  adminId: string
  action: string
  entityType: string
  entityId?: string | null
  summary: string
  beforeJson?: string | null
  afterJson?: string | null
  metadataJson?: string | null
  createdAt: string
}

function pretty(value?: string | null) {
  if (!value) return ''
  try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '250' })
      if (action) params.set('action', action)
      if (entityType) params.set('entityType', entityType)
      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load audit log')
      setLogs(data.logs || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load audit log')
    } finally { setLoading(false) }
  }, [action, entityType])

  useEffect(() => { load() }, [load])

  const actions = Array.from(new Set(logs.map(log => log.action))).sort()
  const entityTypes = Array.from(new Set(logs.map(log => log.entityType))).sort()

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Accountability</p><h2 className="mt-1 text-2xl font-black">Admin audit log</h2><p className="mt-2 max-w-2xl text-sm text-gray-500">Append-only records of sensitive administrative actions. This log cannot be edited from the dashboard.</p></div>
      <div className="flex flex-wrap gap-3"><select value={entityType} onChange={e => setEntityType(e.target.value)} className="rounded-xl border border-[#1e1e35] bg-[#12121f] px-3 py-2 text-sm text-white"><option value="">All areas</option>{entityTypes.map(value => <option key={value} value={value}>{value}</option>)}</select><select value={action} onChange={e => setAction(e.target.value)} className="rounded-xl border border-[#1e1e35] bg-[#12121f] px-3 py-2 text-sm text-white"><option value="">All actions</option>{actions.map(value => <option key={value} value={value}>{value}</option>)}</select><button onClick={load} className="rounded-xl border border-[#1e1e35] px-3 py-2 text-sm text-gray-300 hover:border-[#c9a84c]/50 hover:text-white">Refresh</button></div>
      <div className="overflow-hidden rounded-2xl border border-[#1e1e35] bg-[#12121f]">{loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-[#c9a84c]" /></div> : logs.length === 0 ? <div className="p-12 text-center text-sm text-gray-500"><FileSearch className="mx-auto mb-3 text-gray-600" />No audit entries found.</div> : <div className="divide-y divide-[#1e1e35]">{logs.map(log => { const isOpen = expanded === log.id; return <div key={log.id} className="p-5"><button onClick={() => setExpanded(isOpen ? null : log.id)} className="flex w-full flex-wrap items-start justify-between gap-3 text-left"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-purple-400/10 px-2 py-1 text-[10px] font-bold tracking-wider text-purple-300">{log.action}</span><span className="text-xs text-gray-600">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</span></div><p className="mt-2 text-sm font-semibold text-white">{log.summary}</p></div><time className="shrink-0 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</time></button>{isOpen && <div className="mt-4 grid gap-3 text-xs md:grid-cols-3"><div className="rounded-xl bg-[#0a0a14] p-3"><p className="mb-2 font-semibold uppercase tracking-wider text-gray-500">Before</p><pre className="overflow-auto whitespace-pre-wrap text-gray-300">{pretty(log.beforeJson) || '—'}</pre></div><div className="rounded-xl bg-[#0a0a14] p-3"><p className="mb-2 font-semibold uppercase tracking-wider text-gray-500">After</p><pre className="overflow-auto whitespace-pre-wrap text-gray-300">{pretty(log.afterJson) || '—'}</pre></div><div className="rounded-xl bg-[#0a0a14] p-3"><p className="mb-2 font-semibold uppercase tracking-wider text-gray-500">Metadata / admin</p><pre className="overflow-auto whitespace-pre-wrap text-gray-300">{pretty(log.metadataJson) || '—'}{`\nadminId: ${log.adminId}`}</pre></div></div>}</div> })}</div>}</div>
    </div>
  )
}
