import Image from 'next/image'
import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { CheckCircle, ArrowRight, Shield, Clock, Zap } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter Portfolio', roi: '3.5%', min: 200, max: 1999, duration: '24 Hours', durationDays: 1,
    referral: '5%', color: '#c9a84c', glow: 'rgba(201,168,76,0.12)', popular: false,
    features: ['3.5% daily return on investment', 'Minimum $50 — Maximum $999', 'Profit returned in 24 hours', '5% referral bonus', 'Capital insured', '24/7 support access'],
    desc: 'Perfect for beginners. Get your feet wet with daily compounding returns on a low minimum.',
  },
  {
    name: 'Growth Fund', roi: '12%', min: 2000, max: 4999, duration: '3 Days', durationDays: 3,
    referral: '7%', color: '#e2e8f0', glow: 'rgba(226,232,240,0.08)', popular: true,
    features: ['12% ROI in 3 days', 'Minimum $1,000 — Maximum $4,999', 'Profit returned in 3 days', '7% referral bonus', 'Capital insured', 'Priority support'],
    desc: 'Our most popular plan. Higher returns over 3 days, ideal for committed investors seeking growth.',
  },
  {
    name: 'Apex Fund', roi: '22%', min: 100000, max: 19999, duration: '7 Days', durationDays: 7,
    referral: '10%', color: '#7dd3fc', glow: 'rgba(125,211,252,0.10)', popular: false,
    features: ['22% ROI in 7 days', 'Minimum $5,000 — Maximum $19,999', 'Profit returned in 7 days', '10% referral bonus', 'Capital insured', 'Dedicated account manager'],
    desc: 'For serious investors. Maximum weekly gains with a dedicated manager overseeing your portfolio.',
  },
  {
    name: 'Premium Plan', roi: '38%', min: 100000, max: 500000, duration: '14 Days', durationDays: 14,
    referral: '12%', color: '#c084fc', glow: 'rgba(192,132,252,0.12)', popular: false,
    features: ['38% ROI in 14 days', 'Minimum $20,000 — No upper limit', 'Profit returned in 14 days', '12% referral bonus', 'Capital insured', 'VIP account manager + priority withdrawals'],
    desc: 'Exclusive VIP tier. Institutional-level returns for elite investors with high capital commitment.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create an Account', desc: 'Register in under 2 minutes. Verify your identity with our KYC process to unlock full access.', icon: Zap },
  { step: '02', title: 'Deposit Funds',      desc: 'Fund your account with Bitcoin, Ethereum, or USDT. Deposits are credited within 30 minutes.', icon: Shield },
  { step: '03', title: 'Choose a Plan',      desc: 'Select the investment plan that matches your capital and return goals. Activate instantly.', icon: ArrowRight },
  { step: '04', title: 'Earn & Withdraw',    desc: 'Your principal + profit is returned automatically when the plan matures. Withdraw anytime.', icon: CheckCircle },
]

export default function InvestmentPlansPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      {/* Page hero */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=80&auto=format&fit=crop"
            alt="Investment plans" fill className="object-cover opacity-15" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14]/70 via-[#0a0a14]/80 to-[#0a0a14]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Earn With Us</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Investment <span className="gold-text">Plans</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Four tiers. Every risk appetite. All returns guaranteed and capital-insured. Start with $50 and scale as you grow.
          </p>
        </div>
      </section>

      {/* Plans grid */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className="card-dark flex flex-col relative overflow-hidden transition-all hover:-translate-y-1"
              style={plan.popular ? { borderColor: `${plan.color}50`, boxShadow: `0 0 40px ${plan.glow}` } : {}}>
              {plan.popular && <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: plan.color }} />}
              {plan.popular && (
                <div className="absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full text-[#0a0a14]" style={{ background: plan.color }}>
                  POPULAR
                </div>
              )}
              <div className="p-6 pb-4">
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: plan.color }}>{plan.name}</div>
                <div className="text-6xl font-black leading-none" style={{ color: plan.color }}>{plan.roi}</div>
                <div className="text-gray-500 text-xs mt-1.5">ROI in {plan.duration}</div>
                <p className="text-gray-500 text-xs mt-3 leading-relaxed">{plan.desc}</p>
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

              <div className="p-6 pt-4">
                <Link href="/auth/register"
                  className="w-full block text-center py-3 rounded-xl font-bold text-sm transition-all"
                  style={plan.popular
                    ? { background: `linear-gradient(135deg, ${plan.color}, #e8cc7a)`, color: '#0a0a14' }
                    : { border: `1px solid ${plan.color}30`, color: plan.color }
                  }>
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

      {/* Calculator teaser */}
      <section className="py-20 max-w-3xl mx-auto px-6 text-center">
        <div className="card-dark p-10 border-[#c9a84c]/20">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Quick Example</div>
          <h2 className="text-3xl font-black mb-6">What Could You Earn?</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { plan: 'Starter Portfolio', invest: '$500', profit: '+$40', total: '$540', period: '24h' },
              { plan: 'Platinum', invest: '$2,000', profit: '+$300', total: '$2,300', period: '3 days' },
              { plan: 'Diamond',  invest: '$10,000', profit: '+$2,500', total: '$12,500', period: '7 days' },
            ].map(e => (
              <div key={e.plan} className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-2">{e.plan}</div>
                <div className="text-sm font-semibold mb-1">{e.invest}</div>
                <div className="text-green-400 text-sm font-bold">{e.profit}</div>
                <div className="text-xs text-gray-500 mt-1">in {e.period}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/register" className="btn-gold px-8 py-3 rounded-xl inline-flex items-center gap-2">
            Get Started Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
