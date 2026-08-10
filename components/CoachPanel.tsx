'use client'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, X } from 'lucide-react'

interface Props {
  userData: any
}

function useTypewriter(text: string, speed = 16) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    if (!text) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return displayed
}

export default function CoachPanel({ userData }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const displayed = useTypewriter(message, 16)

  const fetchInsight = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'Give this investor a personalized motivational coaching insight based on their current balance, reinvestment streak, goal progress, and how they compare to peers. Be specific with their numbers.',
          userData,
        }),
      })
      const data = await res.json()
      if (res.ok) setMessage(data.message)
    } catch {}
    setLoading(false)
  }, [userData])

  useEffect(() => { fetchInsight() }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 50,
      width: 300,
      background: 'linear-gradient(135deg, #11131E 0%, #0d1f2d 100%)',
      border: '1px solid #EAB30840',
      borderRadius: 16,
      boxShadow: '0 0 32px rgba(234,179,8,0.08)',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: minimized ? 'none' : '1px solid #1E293B', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={() => setMinimized(m => !m)}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a84c,#EAB308)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#EAB308' }}>APX Coach</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{loading ? 'Analyzing…' : 'Live insight'}</div>
        </div>
        <button onClick={e => { e.stopPropagation(); fetchInsight() }} disabled={loading}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4 }}
          title="Refresh">
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        <button onClick={e => { e.stopPropagation(); setVisible(false) }}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4 }}>
          <X size={12} />
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, minHeight: 56 }}>
            {loading
              ? <span style={{ color: '#334155' }}>● ● ●</span>
              : displayed || <span style={{ color: '#334155' }}>● ● ●</span>
            }
          </div>
        </div>
      )}
    </div>
  )
}
