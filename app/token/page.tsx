import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { APX_BUY_RATE, APX_REDEMPTION_RATE, APX_SUPPLY, formatApx } from '@/lib/apx'
import Link from 'next/link'

const CONTRACT = '0x8d6032443cb7b23c134094c8921f1f37824ea3a2'

async function getTokenStats() {
  const bscKey = process.env.BSCSCAN_API_KEY
  const stats = {
    holders: null as number | null,
    supply: APX_SUPPLY,
    priceUsd: null as number | null,
  }

  try {
    if (bscKey) {
      const supplyRes = await fetch(`https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${CONTRACT}&apikey=${bscKey}`, { cache: 'no-store' })
      const supplyJson = await supplyRes.json()
      if (supplyJson?.status === '1' && supplyJson?.result) {
        const raw = Number(supplyJson.result)
        if (!Number.isNaN(raw) && raw > 0) {
          stats.supply = raw / 1e18
        }
      }
    }
  } catch {
    // keep fallback values
  }

  try {
    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONTRACT}`, { cache: 'no-store' })
    const dexJson = await dexRes.json()
    if (Array.isArray(dexJson?.pairs) && dexJson.pairs.length > 0) {
      const top = dexJson.pairs[0]
      const p = Number(top?.priceUsd)
      if (!Number.isNaN(p)) stats.priceUsd = p
    }
  } catch {
    // APX may not be listed yet
  }

  return stats
}

export default async function TokenPage() {
  const stats = await getTokenStats()

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="card-dark p-8 md:p-10">
          <p className="text-xs tracking-[0.2em] text-[#c9a84c] mb-4 uppercase">APX Ecosystem Asset</p>
          <h1 className="text-4xl md:text-5xl font-black mb-3" style={{ fontFamily: '"IBM Plex Sans", "DIN Alternate", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
            APX Token
          </h1>
          <p className="text-gray-400 max-w-2xl">
            APX is the native platform token for APXFund. It powers internal accumulation, rewards, and scheduled redemption while liquidity is being prepared.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            <Metric label="Total Supply" value={`${formatApx(stats.supply)} APX`} />
            <Metric label="Internal Buy Rate" value={`$${APX_BUY_RATE}`} />
            <Metric label="Internal Redemption" value={`$${APX_REDEMPTION_RATE}`} />
            <Metric label="Market Price" value={stats.priceUsd ? `$${stats.priceUsd.toFixed(6)}` : 'Not listed yet'} />
          </div>

          <div className="mt-8 p-4 rounded-xl border border-[#1e1e35] bg-[#0d0f18]">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Live Contract</div>
            <div className="text-sm break-all font-mono text-gray-200">{CONTRACT}</div>
            <a
              className="inline-block mt-3 text-[#c9a84c] hover:underline text-sm"
              href={`https://bscscan.com/token/${CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on BscScan
            </a>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-5 text-sm text-gray-300">
            <div>
              <h3 className="font-bold text-white mb-2">Current Utility</h3>
              <ul className="space-y-1">
                <li>Buy APX inside APXFund using USD balance</li>
                <li>Earn APX rewards when investment cycles mature</li>
                <li>Redeem APX via internal Option B queue</li>
                <li>Hold APX ahead of external liquidity events</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">How To Start</h3>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Create and verify your APXFund account</li>
                <li>Deposit and fund your dashboard balance</li>
                <li>Open APX Wallet and buy APX internally</li>
                <li>Track APX rewards and redemption requests</li>
              </ol>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tokenomics" className="btn-gold px-5 py-3 rounded-xl text-sm font-bold">
              View Tokenomics
            </Link>
            <Link href="/litepaper" className="px-5 py-3 rounded-xl text-sm font-bold border border-[#1e1e35] text-gray-200 hover:border-[#c9a84c]/50">
              Read Litepaper
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1e1e35] bg-[#0d0f18] p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-black text-[#e8cc7a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  )
}
