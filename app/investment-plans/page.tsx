import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { CheckCircle, ArrowRight, Shield, Clock, Zap, AlertCircle } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter Portfolio',
    roi: '3.5%',
    min: 200,
    max: 1999,
    duration: '7 Days',
    durationDays: 7,
    referral: '5%',
    color: '#c9a84c',
    glow: 'rgba(201,168,76,0.12)',
    popular: false,
    badge: '2 Cycles Max',
    features: [
      '3.5% fixed return over 7 days',
      '$200 minimum — $1,999 maximum',
      'Limited to 2 cycles per account',
      'Capital locked pending migration after cycle 2',
      'Profits withdrawable at each cycle end',
      '5% referral bonus',
      '24/7 support access',
    ],
    desc: 'The structured entry point to APXFund. Complete 2 cycles, then migrate your capital to a higher-yield plan.',
    note: 'Starter Portfolio is limited to 2 cycles per account. After completion, capital migrates to your chosen next plan.',
  },
  {
    name: 'Growth Fund',
    roi: '12%',
    min: 2000,
    max: 29000,
    duration: '14 Days',
    durationDays: 14,
    referral: '7%',
    color: '#e2e8f0',
    glow: 'rgba(226,232,240,0.08)',
    popular: true,
    badge: null,
    features: [
      '12% fixed return over 14 days',
      '$2,000 minimum — $29,999 maximum',
      'Auto-rolls at maturity by default',
      'Profits withdrawable at each cycle end',
      '7% referral bonus',
      'Priority support',
      'Stop-renewing toggle available',
    ],
    desc: 'Our most popular plan. Steady 14-day cycles with strong returns for committed investors.',
    note: null,
  },
  {
    name: 'Apex Fund',
    roi: '22%',
    min: 30000,
    max: 99999,
    duration: '30 Days',
    durationDays: 30,
    referral: '10%',
    color: '#7dd3fc',
    glow: 'rgba(125,211,252,0.10)',
    popular: false,
    badge: null,
    features: [
      '22% fixed return over 30 days',
      '$30,000 minimum — $99,999 maximum',
      'Auto-rolls at maturity by default',
      'Profits withdrawable at each cycle end',
      '10% referral bonus',
      'Dedicated account manager',
      'Stop-renewing toggle available',
    ],
    desc: 'For serious investors. Maximum monthly gains with a dedicated manager overseeing your portfolio.',
    note: null,
  },
  {
    name: 'Sovereign Tier',
    roi: '38%',
    min: 100000,
    max: 500000,
    duration: '30 Days',
    durationDays: 30,
    referral: '15%',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.12)',
    popular: false,
    badge: 'VIP',
    features: [
      '38% fixed return over 30 days',
      '$100,000 minimum — $500,000 maximum',
      'Auto-rolls at maturity by default',
      'Profits withdrawable at each cycle end',
      '15% referral bonus',
      'VIP private account manager',
      'Priority withdrawals & white-glove service',
    ],
    desc: 'Exclusive VIP tier. Institutional-level returns for elite investors with high capital commitment.',
    note: null,
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create an Account',   desc: 'Register in under 2 minutes. Complete KYC verification to unlock full platform access.', icon: Zap },
  { step: '02', title: 'Deposit Funds',        desc: 'Fund your account with Bitcoin, Ethereum, USDT (TRC-20), or USDC (Arbitrum). Credited within 30 minutes.', icon: Shield },
  { step: '03', title: 'Choose a Plan',        desc: 'Select the plan that matches your capital. Starter Portfolio investors complete 2 cycles then migrate upward.', icon: ArrowRight },
  { step: '04', title: 'Earn & Migrate',       desc: 'Profits are credited at each cycle end and are fully withdrawable. Capital migrates upward through tiers as you grow.', icon: CheckCircle },
]

const EXAMPLES = [
  { plan: 'Starter Portfolio', invest: '$500',    profit: '+$17.50',    total: '$517.50',    period: '7 days',  color: '#c9a84c' },
  { plan: 'Growth Fund',       invest: '$2,000',  profit: '+$240',      total: '$2,240',     period: '14 days', color: '#e2e8f0' },
  { plan: 'Apex Fund',         invest: '$30,000', profit: '+$6,600',    total: '$36,600',    period: '30 days', color: '#7dd3fc' },
]

export default function InvestmentPlansPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      {/* Hero — no image */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#c9a84c 1px,transparent 1px),linear-gradient(90deg,#c9a84c 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a84c]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Structured Investment Tiers</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Investment <span className="gold-text">Plans</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Four structured tiers designed for progressive wealth building. Start with Starter Portfolio, complete 2 cycles, then migrate your capital to higher-yield plans.
          </p>
        </div>
      </section>

      {/* Important notice */}
      <section className="max-w-7xl mx-auto px-6 mb-8">
        <div className="bg-[#c9a84c]/8 border border-[#c9a84c]/25 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle size={20} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-[#c9a84c] text-sm mb-1">How APXFund Plans Work</div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Starter Portfolio is limited to <strong className="text-white">2 cycles per account</strong>. After completing both cycles, your capital is held and you migrate to Growth Fund, Apex Fund, or Sovereign Tier. All profits are withdrawable at every cycle end. Capital in active plans is locked until maturity.
            </p>
          </div>
        </div>
      </section>

      {/* Plans grid */}
      <section className="py-8 max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name}
              className="card-dark flex flex-col relative overflow-hidden transition-all hover:-translate-y-1"
              style={plan.popular ? { borderColor: `${plan.color}50`, boxShadow: `0 0 40px ${plan.glow}` } : {}}>
              {plan.popular && <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: plan.color }} />}

              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                {plan.popular && (
                  <div className="text-xs font-black px-2.5 py-1 rounded-full text-[#0a0a14]" style={{ background: plan.color }}>POPULAR</div>
                )}
                {plan.badge && !plan.popular && (
                  <div className="text-xs font-black px-2.5 py-1 rounded-full border" style={{ color: plan.color, borderColor: `${plan.color}40` }}>{plan.badge}</div>
                )}
              </div>

              <div className="p-6 pb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: plan.color }}>{plan.name}</div>
                <div className="text-5xl font-black leading-none" style={{ color: plan.color }}>{plan.roi}</div>
                <div className="text-gray-500 text-xs mt-1.5">Fixed return · {plan.duration}</div>
                <p className="text-gray-500 text-xs mt-3 leading-relaxed">{plan.desc}</p>
              </div>

              <div className="px-6 pb-4 border-t border-[#1e1e35] pt-4">
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-gray-500">Min deposit</span>
                  <span className="font-bold text-white">${plan.min.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">Max deposit</span>
                  <span className="font-bold text-white">${plan.max.toLocaleString()}</span>
                </div>
              </div>

              <div className="px-6 pb-4 border-t border-[#1e1e35] pt-4 flex-1">
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                      <CheckCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.note && (
                <div className="px-6 pb-4">
                  <div className="bg-[#c9a84c]/8 border border-[#c9a84c]/20 rounded-xl p-3 text-xs text-[#c9a84c] leading-relaxed">
                    ℹ️ {plan.note}
                  </div>
                </div>
              )}

              <div className="p-6 pt-2">
                <Link href="/auth/register"
                  className="w-full block text-center py-3 rounded-xl font-bold text-sm transition-all"
                  style={plan.popular
                    ? { background: `linear-gradient(135deg, ${plan.color}, #e8cc7a)`, color: '#0a0a14' }
                    : { border: `1px solid ${plan.color}30`, color: plan.color }}>
                  Start with {plan.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Simple Process</div>
            <h2 className="text-4xl font-black">How It <span className="gold-text">Works</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="card-dark p-6 hover:border-[#c9a84c]/30 transition-all relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-black text-white/3 select-none">{step}</div>
                <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#c9a84c]" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings examples */}
      <section className="py-20 max-w-4xl mx-auto px-6 text-center">
        <div className="card-dark p-10 border-[#c9a84c]/20">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Quick Example</div>
          <h2 className="text-3xl font-black mb-8">What Could You Earn?</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {EXAMPLES.map(e => (
              <div key={e.plan} className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: e.color }}>{e.plan}</div>
                <div className="text-lg font-black text-white mb-1">{e.invest}</div>
                <div className="text-green-400 text-lg font-black">{e.profit}</div>
                <div className="text-gray-500 text-xs mt-1">in {e.period}</div>
                <div className="text-gray-600 text-xs mt-2 border-t border-[#1e1e35] pt-2">Total: {e.total}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/register" className="btn-gold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 font-bold">
            Get Started Now <ArrowRight size={16} />
          </Link>
          <p className="text-gray-600 text-xs mt-4">Capital is locked during active plan cycles. Profits are withdrawable at cycle end.</p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
