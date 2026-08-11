import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import Link from 'next/link'
import { APX_SUPPLY, APX_BUY_RATE, APX_REDEMPTION_RATE, APX_REWARD_SHARE } from '@/lib/apx'

const CONTRACT = '0x8d6032443cb7b23c134094c8921f1f37824ea3a2'

export default function TokenomicsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      <section className="max-w-6xl mx-auto px-6 py-16 space-y-6">
        <div className="card-dark p-8 md:p-10">
          <p className="text-xs tracking-[0.18em] text-[#c9a84c] mb-4 uppercase">APX Economics Framework</p>
          <h1 className="text-4xl md:text-5xl font-black mb-3">APX Tokenomics</h1>
          <p className="text-gray-400 max-w-3xl">
            This page defines how APX is issued, used, rewarded, and redeemed before public liquidity listing.
            It is aligned with the live APXFund platform logic and Option B redemption model.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            <Metric label="Total Supply Cap" value={`${APX_SUPPLY.toLocaleString()} APX`} />
            <Metric label="Internal Buy Rate" value={`$${APX_BUY_RATE} / APX`} />
            <Metric label="Internal Redemption Rate" value={`$${APX_REDEMPTION_RATE} / APX`} />
            <Metric label="Reward Emission Formula" value={`${(APX_REWARD_SHARE * 100).toFixed(0)}% of cycle profit`} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card-dark p-6">
            <h2 className="text-xl font-bold mb-3">Core Utility</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Users buy APX from dashboard USD balance.</li>
              <li>Users earn APX automatically when cycles mature.</li>
              <li>Users submit APX redemptions through internal queue.</li>
              <li>Admin processes approvals and weekly settlements to USD balance.</li>
            </ul>
          </div>

          <div className="card-dark p-6">
            <h2 className="text-xl font-bold mb-3">Pre-Listing Rules</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>APX accounting is active inside platform wallet.</li>
              <li>Redemption follows Option B (queue + scheduled settlement).</li>
              <li>External exchange price discovery is not guaranteed pre-listing.</li>
              <li>Contract: <span className="font-mono text-xs break-all text-gray-200">{CONTRACT}</span></li>
            </ul>
          </div>
        </div>

        <div className="card-dark p-6">
          <h2 className="text-xl font-bold mb-4">Economic Flows</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <FlowCard
              title="1. Buy Flow"
              body="User spends USD balance and receives APX at the internal buy rate."
              tone="#60a5fa"
            />
            <FlowCard
              title="2. Reward Flow"
              body="At maturity, APX reward is minted using reward share formula tied to realized cycle profit."
              tone="#22d3ee"
            />
            <FlowCard
              title="3. Redemption Flow"
              body="User submits APX request. Admin approves and settles in USD based on redemption rate."
              tone="#34d399"
            />
          </div>
        </div>

        <div className="card-dark p-6">
          <h2 className="text-xl font-bold mb-3">Governance Notes</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Rate parameters and settlement cadence may be adjusted by APXFund operations based on treasury capacity,
            market conditions, and platform risk controls. Material changes should be disclosed publicly in advance.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/token" className="btn-gold px-5 py-3 rounded-xl text-sm font-bold">Back to APX Token Page</Link>
          <Link href="/litepaper" className="px-5 py-3 rounded-xl text-sm font-bold border border-[#1e1e35] text-gray-200 hover:border-[#c9a84c]/50">Read Litepaper</Link>
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
      <p className="text-base md:text-lg font-black text-[#e8cc7a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  )
}

function FlowCard({ title, body, tone }: { title: string; body: string; tone: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: `${tone}50`, background: `${tone}12` }}>
      <h3 className="font-bold mb-2" style={{ color: tone }}>{title}</h3>
      <p className="text-gray-300 leading-relaxed">{body}</p>
    </div>
  )
}
