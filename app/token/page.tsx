import Image from 'next/image'
import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { APX_BUY_RATE, APX_REDEMPTION_RATE, APX_SUPPLY, formatApx } from '@/lib/apx'

const CONTRACT = '0x8d6032443cb7B23c134094c8921F1F37824EA3a2'

async function getTokenStats() {
  const stats = { holders: null as number | null, supply: APX_SUPPLY, priceUsd: null as number | null }
  try {
    if (process.env.BSCSCAN_API_KEY) {
      const response = await fetch(`https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${CONTRACT}&apikey=${process.env.BSCSCAN_API_KEY}`, { cache: 'no-store' })
      const data = await response.json()
      if (data?.status === '1' && data?.result) stats.supply = Number(data.result) / 1e18
    }
  } catch {}
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONTRACT}`, { cache: 'no-store' })
    const data = await response.json()
    const price = Number(data?.pairs?.[0]?.priceUsd)
    if (Number.isFinite(price)) stats.priceUsd = price
  } catch {}
  return stats
}

const roadmap = [
  { phase: '01', status: 'Live', title: 'Platform foundation', body: 'APX is issued on BNB Smart Chain and connected to the APXFund account, wallet, rewards, and redemption workflows.' },
  { phase: '02', status: 'Live', title: 'Utility and rewards', body: 'Users can acquire APX through the platform, track balances and rewards, and submit redemption requests through the operating workflow.' },
  { phase: '03', status: 'Building', title: 'Market access and visibility', body: 'Improve wallet metadata, publish clearer token documentation, and strengthen the APX market-data and liquidity experience.' },
  { phase: '04', status: 'Planned', title: 'Expanded ecosystem utility', body: 'Evaluate additional APX use cases, partner integrations, and product benefits as technical, operational, and compliance requirements are met.' },
]

export default async function TokenPage() {
  const stats = await getTokenStats()
  return <div className="min-h-screen bg-[#0a0a14] text-white"><PublicHeader />
    <main>
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-10">
        <div className="premium-surface rounded-3xl p-7 md:p-11 overflow-hidden relative">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#c9a84c]/10 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1.25fr_.75fr] gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6"><span className="rounded-full border border-[#c9a84c]/40 bg-[#c9a84c]/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#e8cc7a]">APX ecosystem asset</span><span className="text-xs text-emerald-300">BNB Smart Chain</span></div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">A practical token for a growing platform.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">APX is the utility and rewards token connected to APXFund. This page separates what is operating today from the capabilities being built next.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/tokenomics" className="btn-gold rounded-xl">Explore tokenomics</Link><Link href="/litepaper" className="rounded-xl border border-[#2a2a45] px-5 py-3 font-semibold text-gray-200 hover:border-[#c9a84c]/60">Read the litepaper</Link></div>
            </div>
            <div className="flex justify-center"><Image src="/apx-token-logo-100kb.png" alt="APX token logo" width={256} height={256} className="h-52 w-52 md:h-64 md:w-64 rounded-3xl" priority /></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-10"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Supply cap" value={`${formatApx(stats.supply)} APX`} /><Metric label="Internal buy rate" value={`$${APX_BUY_RATE} / APX`} /><Metric label="Internal redemption" value={`$${APX_REDEMPTION_RATE} / APX`} /><Metric label="DEX reference" value={stats.priceUsd ? `$${stats.priceUsd}` : 'See PancakeSwap'} /></div></section>

      <section className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[.85fr_1.15fr] gap-6">
        <div className="card-dark p-7"><Label>Why APX exists</Label><h2 className="mt-3 text-2xl font-bold">A utility layer for platform participation.</h2><p className="mt-4 text-sm leading-7 text-gray-400">APX connects platform balances, reward allocation, wallet visibility, and redemption requests in one token framework. The economics are designed around the platform’s operating model rather than a promise of a fixed market outcome.</p><div className="mt-6 space-y-3 text-sm text-gray-300"><Bullet>Platform acquisition and account-based balance tracking</Bullet><Bullet>Reward allocations linked to platform activity</Bullet><Bullet>Internal redemption requests and settlement workflow</Bullet><Bullet>External BNB Smart Chain market access through supported venues</Bullet></div></div>
        <div className="card-dark p-7"><div className="flex items-center justify-between gap-4"><div><Label>Roadmap</Label><h2 className="mt-3 text-2xl font-bold">From foundation to broader utility.</h2></div><Link href="/litepaper#roadmap" className="text-sm text-[#e8cc7a] hover:underline">Full roadmap →</Link></div><div className="mt-7 space-y-5">{roadmap.map(item => <div key={item.phase} className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a84c]/50 text-xs font-bold text-[#e8cc7a]">{item.phase}</div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.title}</h3><Status status={item.status} /></div><p className="mt-1 text-sm leading-6 text-gray-400">{item.body}</p></div></div>)}</div></div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10"><div className="card-dark p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><Label>Verified reference</Label><h2 className="mt-3 text-2xl font-bold">Check the contract and market yourself.</h2></div><div className="flex flex-wrap gap-3"><a href={`https://bscscan.com/token/${CONTRACT}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#2a2a45] px-4 py-2 text-sm text-gray-200 hover:border-[#c9a84c]/60">BscScan ↗</a><a href={`https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=${CONTRACT}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#2a2a45] px-4 py-2 text-sm text-gray-200 hover:border-[#c9a84c]/60">PancakeSwap ↗</a></div></div><p className="mt-5 break-all rounded-xl bg-[#0a0a14] p-4 font-mono text-xs text-gray-300">{CONTRACT}</p><p className="mt-3 text-xs text-gray-500">Network: BNB Smart Chain · Symbol: APX · Decimals: 18</p></div></section>
    </main><PublicFooter /></div>
}

function Label({ children }: { children: React.ReactNode }) { return <p className="text-[11px] uppercase tracking-[0.2em] text-[#c9a84c]">{children}</p> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="card-dark p-5"><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p><p className="mt-2 text-lg font-black text-[#e8cc7a]">{value}</p></div> }
function Bullet({ children }: { children: React.ReactNode }) { return <div className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a84c]" /><span>{children}</span></div> }
function Status({ status }: { status: string }) { const style = status === 'Live' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : status === 'Building' ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : 'border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#e8cc7a]'; return <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${style}`}>{status}</span> }
