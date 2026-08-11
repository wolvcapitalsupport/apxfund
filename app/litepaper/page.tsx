import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import Link from 'next/link'

export default function LitepaperPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-6">
        <div className="card-dark p-8">
          <p className="text-xs tracking-[0.2em] text-[#c9a84c] mb-3 uppercase">APXFund Document</p>
          <h1 className="text-4xl md:text-5xl font-black mb-2">APX Litepaper</h1>
          <p className="text-sm text-gray-400">Version 1.0 · August 2026</p>
        </div>

        <Section title="1. Executive Summary">
          APX is the ecosystem token of APXFund, designed to align user growth, platform retention,
          and treasury-backed settlement before full external liquidity listing. APX operates through
          transparent internal buy, reward, and redemption mechanics.
        </Section>

        <Section title="2. Problem and Approach">
          Pre-listing tokens often fail because utility is promised but not operational. APX solves this by
          enabling immediate platform utility: users can buy APX, earn APX from completed cycles, and request
          redemption to USD through managed queue settlement.
        </Section>

        <Section title="3. Token Utility">
          APX has three active utility channels in production: portfolio reward accumulation, internal treasury
          conversion, and optional long-term holding ahead of public liquidity events.
        </Section>

        <Section title="4. Economic Model">
          Internal APX pricing uses a buy rate and a redemption rate. Reward emissions are formula-driven and
          tied to cycle performance. Redemption follows Option B operations: user request, admin approval,
          and scheduled settlement.
        </Section>

        <Section title="5. Redemption and Risk Controls">
          APX redemption requests are queued and processed according to available treasury capacity. This model
          avoids false instant-liquidity assumptions and keeps operations transparent while liquidity is being built.
        </Section>

        <Section title="6. Contract and Asset Integrity">
          APX is deployed on BNB Smart Chain. Users can verify contract metadata on-chain and import the token
          manually to external wallets using contract details.
        </Section>

        <Section title="7. Governance and Disclosure">
          APXFund may adjust internal rates and settlement cadence as operational conditions change. Any material
          parameter changes should be disclosed publicly and reflected on the Tokenomics page.
        </Section>

        <Section title="8. Forward Plan">
          The roadmap includes external liquidity listing, broader wallet UX, and deeper reporting around treasury,
          issuance, and redemption performance for ecosystem transparency.
        </Section>

        <div className="card-dark p-6 text-sm text-gray-400">
          This litepaper is an operational overview for platform participants. It is not investment advice and does
          not constitute an offer of securities in any jurisdiction.
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href="/tokenomics" className="btn-gold px-5 py-3 rounded-xl text-sm font-bold">Open Tokenomics</Link>
          <Link href="/token" className="px-5 py-3 rounded-xl text-sm font-bold border border-[#1e1e35] text-gray-200 hover:border-[#c9a84c]/50">Back to Token Page</Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-dark p-6">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-300 leading-relaxed">{children}</p>
    </div>
  )
}
