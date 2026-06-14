'use client'
import { useEffect, useRef, useState } from 'react'

export default function TickingBalance({ balance, investments }: {
  balance: number
  investments: any[]
}) {
  const [display, setDisplay] = useState(balance)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(Date.now())
  const baseRef = useRef<number>(balance)

  // Calculate per-second accrual from all active investments
  const perSecond = investments
    .filter(i => i.status === 'ACTIVE')
    .reduce((acc, inv) => {
      const start = new Date(inv.startDate).getTime()
      const end = new Date(inv.endDate).getTime()
      const durationSecs = (end - start) / 1000
      const profit = inv.expectedProfit || 0
      return acc + (profit / durationSecs)
    }, 0)

  useEffect(() => {
    baseRef.current = balance
    startRef.current = Date.now()
    setDisplay(balance)
  }, [balance])

  useEffect(() => {
    if (perSecond <= 0) return

    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000
      setDisplay(baseRef.current + perSecond * elapsed)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [perSecond])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })

  return (
    <span className="font-black tabular-nums">
      ${formatted}
    </span>
  )
}
