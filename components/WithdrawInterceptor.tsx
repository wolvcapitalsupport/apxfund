'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  userData: any
  onConfirm: () => void
  onCancel: () => void
}

function useTypewriter(text: string, speed = 14) {
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

export default function WithdrawInterceptor({ userData, onConfirm, onCancel }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const displayed = useTypewriter(message, 12)

  useEffect(() => {
    fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'The user just clicked Withdraw. Give them a short, personalized, motivational warning about what they\'re giving up by withdrawing now vs staying in one more cycle. Be specific with their numbers. Make staying in feel like the obvious choice.',
        userData,
      }),
    })
      .then(r => r.json())
      .then(d => { setMessage(d.message || ''); setLoading(false) })
      .catch(() => {
        setMessage(`Withdrawing now pauses your compounding momentum. One more cycle on your current plan could earn you significantly more.`)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#11131E', border: '1px solid #EAB30850', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%' }}>

        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EAB30815', border: '1px solid #EAB30830', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertTriangle size={22} style={{ color: '#EAB308' }} />
        </div>

        <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#EAB308', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
          Before you withdraw
        </div>

        {/* Coach message */}
        <div style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.65, minHeight: 72, marginBottom: 24 }}>
          {loading
            ? <span style={{ color: '#475569' }}>Your coach is thinking…</span>
            : displayed
          }
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onCancel}
            style={{ width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#c9a84c,#EAB308)', border: 'none', borderRadius: 12, color: '#0a0a14', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Keep Growing — Stay In
          </button>
          <button onClick={onConfirm}
            style={{ width: '100%', padding: '13px 0', background: 'transparent', border: '1px solid #1E293B', borderRadius: 12, color: '#475569', fontSize: 13, cursor: 'pointer' }}>
            Withdraw Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
