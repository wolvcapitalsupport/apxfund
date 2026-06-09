'use client'
import { useEffect, useRef } from 'react'

export default function CryptoTicker() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement("script")
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
      script.type = "text/javascript"
      script.async = true
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "BINANCE:BTCUSDT", "title": "Bitcoin" },
          { "proName": "BINANCE:ETHUSDT", "title": "Ethereum" },
          { "proName": "BINANCE:TRXUSDT", "title": "TRON" },
          { "proName": "BINANCE:SOLUSDT", "title": "Solana" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      })
      container.current.appendChild(script)
    }
  }, [])

  return (
    <div className="bg-[#0a0a14] border-b border-white/5 py-1">
      <div ref={container} className="tradingview-widget-container">
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  )
}
