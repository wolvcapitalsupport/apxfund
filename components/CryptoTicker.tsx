'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Coin = { symbol: string; name: string; price: number; change: number }

const COINS = ['bitcoin', 'ethereum', 'tether', 'ripple', 'binancecoin', 'solana']
const SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', tether: 'USDT',
  ripple: 'XRP', binancecoin: 'BNB', solana: 'SOL'
}

export default function CryptoTicker() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPrices = async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=usd&include_24hr_change=true`
      )
      const data = await res.json()
      const parsed: Coin[] = COINS.map(id => ({
        symbol: SYMBOLS[id],
        name: id.charAt(0).toUpperCase() + id.slice(1),
        price: data[id]?.usd || 0,
        change: data[id]?.usd_24h_change || 0,
      }))
      setCoins(parsed)
      setLoading(false)
    } catch {}
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading || coins.length === 0) return null

  return (
    <div className="w-full bg-[#12121f] border-b border-[#1e1e35] overflow-hidden">
      <div className="flex animate-ticker">
        {[...coins, ...coins].map((coin, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0 border-r border-[#1e1e35]">
            <span className="text-xs font-black text-white">{coin.symbol}</span>
            <span className="text-xs font-bold text-[#c9a84c]">
              ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs flex items-center gap-0.5 ${coin.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {coin.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(coin.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
