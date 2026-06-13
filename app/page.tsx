'use client'
import CryptoTicker from '@/components/CryptoTicker'

import AnimatedHero from './components/AnimatedHero'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { useLang } from '@/lib/useLang'
import { t } from '@/lib/i18n'
import {
  Shield, TrendingUp, Clock, Users,
  Bitcoin, DollarSign, BarChart3, Globe,
  CheckCircle, ArrowRight, Zap, Lock, HeadphonesIcon,
  ChevronDown, ChevronRight
} from 'lucide-react'

const STATS: { labelKey: string; value: string; icon: any }[] = [
  { labelKey: 'home.statsInvestors', value: '8,400+', icon: Users },
  { labelKey: 'home.statsPaid',      value: '$312M+', icon: DollarSign },
  { labelKey: 'home.statsCountries', value: '120+',   icon: Globe },
  { labelKey: 'home.statsUptime',    value: '99.9%',  icon: Clock },
]

const SERVICES = [
  { title: 'Cryptocurrencies', icon: Bitcoin,    desc: 'Trade and invest in top digital assets with fully automated portfolio management and real-time market execution.' },
  { title: 'Forex Trading',    icon: BarChart3,  desc: 'Access global currency markets with expert algorithmic strategies and institutional-grade liquidity.' },
  { title: 'Hedge Funds',      icon: TrendingUp, desc: 'Diversified hedge fund exposure managed by seasoned professionals across liquid asset classes.' },
  { title: 'Escrow Services',  icon: Shield,     desc: 'Secure transaction escrow ensuring your capital is protected throughout every deal.' },
  { title: 'Loans',            icon: DollarSign, desc: 'Flexible lending solutions backed by your investment portfolio. Capital when you need it.' },
  { title: 'NFP Trading',      icon: BarChart3,  desc: 'Capitalise on Non-Farm Payroll announcements — one of the most predictable forex market events.' },
]

const PLANS = [
  { name: 'Starter Portfolio', roi: '3.5%', min: '$200',     max: '$1,999',    duration: '7 Days',  referral: '5%',  color: '#c9a84c', popular: false },
  { name: 'Growth Fund',       roi: '12%',  min: '$2,000',   max: '$29,000',   duration: '14 Days', referral: '7%',  color: '#e2e8f0', popular: true  },
  { name: 'Apex Fund',         roi: '22%',  min: '$30,000',  max: '$99,000',   duration: '30 Days', referral: '10%', color: '#7dd3fc', popular: false },
  { name: 'Sovereign Tier',    roi: '38%',  min: '$100,000', max: '$500,000',  duration: '30 Days', referral: '15%', color: '#c084fc', popular: false },
]

const TESTIMONIALS = [
  { name: 'Michael R.', country: 'United States', rating: 5, initials: 'MR', color: '#c9a84c', text: 'Started with the Starter Portfolio and rolled returns into the Growth Fund. My balance reflected exactly what was promised at maturity. Withdrawals processed same day.' },
  { name: 'Amira K.',   country: 'UAE',           rating: 5, initials: 'AK', color: '#60a5fa', text: 'I have been with APXFund for 8 months across three different plans. Every payout has been accurate and on time. KYC was straightforward and support responds fast.' },
  { name: 'James T.',   country: 'United Kingdom',rating: 5, initials: 'JT', color: '#34d399', text: 'Transparent, reliable, and the support team is genuinely available 24/7. The dashboard gives full visibility of my portfolio at all times. Highly recommended.' },
]

const FAQS = [
  { q: 'How long does it take for my deposit to be credited?',  a: 'Deposits are reviewed and credited within 5–30 minutes of confirmation on the blockchain.' },
  { q: 'How long does the withdrawal process take?',            a: 'Withdrawals are processed within 1 hour. Occasionally delays occur due to network congestion, but we always prioritise fast disbursement.' },
  { q: 'Is my investment capital insured?',                     a: 'Yes. All invested funds are capital-insured. Should trading go against expectations, your principal is covered by our insurance policy up to $1,000,000.' },
  { q: 'Do you charge fees for your services?',                 a: 'No fees are charged to investors. We retain our operating profit before crediting your predetermined return rate.' },
  { q: 'What is the minimum investment?',                       a: 'You can start with as little as $200 on our Starter Portfolio plan.' },
  { q: 'Can I have multiple active investments?',               a: 'Yes. You can run multiple plans simultaneously across different tiers.' },
]

const WHY_US = [
  { icon: Lock,           label: 'Highly Secured',    desc: 'Military-grade encryption and multi-factor authentication protect every account.' },
  { icon: TrendingUp,     label: 'High ROI',          desc: 'Industry-leading returns powered by algorithmic trading and expert fund managers.' },
  { icon: CheckCircle,    label: 'Guaranteed Returns',desc: 'Capital insurance covers your principal on every plan. Invest with confidence.' },
  { icon: HeadphonesIcon, label: '24/7 Live Support', desc: 'Our support team is available around the clock via live chat and email.' },
]

export default function HomePage() {
  const { lang } = useLang()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />
      <CryptoTicker />
      <AnimatedHero />

      {/* STATS */}
      <section className="py-12 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ labelKey, value, icon: Icon }) => (
            <div key={labelKey} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-[#c9a84c]" />
              </div>
              <div className="text-3xl font-black gold-text mb-1">{value}</div>
              <div className="text-gray-500 text-sm">{t(lang, labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about-us" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">About APXFund</div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              A Global Asset Management <span className="gold-text">Leader</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              APXFund is a United States-based Asset and Stock Management Company with affiliates across Europe, Asia, and the Middle East. Established in 2016, we began trading stocks, shares, and bonds before expanding into Forex in 2018 and Cryptocurrency in 2019.
            </p>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our 130+ team of professionals employs research-driven quantitative strategies across a wide range of liquid asset classes. We partner with the highest-quality fund managers and deliver a consistently exceptional rate of return.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {WHY_US.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-[#12121f] border border-[#1e1e35] rounded-xl p-4 hover:border-[#c9a84c]/30 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#c9a84c]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5">{label}</div>
                    <div className="text-gray-500 text-xs leading-snug">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/about" className="btn-gold px-6 py-3 rounded-xl inline-flex items-center gap-2 text-sm">
              Read More About Us <ArrowRight size={16} />
            </Link>
          </div>

          {/* CEO card - initials only, no photo */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden flex flex-col items-center justify-center p-12"
              style={{ minHeight: '420px', background: 'linear-gradient(135deg,#c9a84c15,#c9a84c05)', border: '1px solid #c9a84c22' }}>
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: '#c9a84c20', border: '2px solid #c9a84c40' }}>
                <span className="text-4xl font-black text-[#c9a84c]">BM</span>
              </div>
              <h3 className="text-xl font-bold text-center">Bryce J. McFarlane</h3>
              <p className="text-sm font-semibold mt-1" style={{ color: '#c9a84c' }}>Chief Executive Officer & Founder</p>
              <p className="text-gray-400 text-xs mt-4 text-center max-w-xs leading-relaxed">
                20+ years in global asset management. Former Goldman Sachs VP. Expert in quantitative trading strategy and hedge fund operations.
              </p>
            </div>
            <div className="absolute -top-4 -right-4 bg-[#12121f] border border-[#c9a84c]/30 rounded-2xl p-4 shadow-xl">
              <div className="text-2xl font-black gold-text">$312M+</div>
              <div className="text-xs text-gray-400">Paid to investors</div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#12121f] border border-[#1e1e35] rounded-2xl p-4 shadow-xl">
              <div className="text-2xl font-black text-green-400">99.9%</div>
              <div className="text-xs text-gray-400">Uptime guaranteed</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">What We Offer</div>
            <h2 className="text-4xl md:text-5xl font-black">Our <span className="gold-text">Services</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ title, icon: Icon, desc }) => (
              <div key={title} className="card-dark p-6 hover:border-[#c9a84c]/40 transition-all hover:-translate-y-1">
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

      {/* PLANS */}
      <section id="plans" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Investment Plans</div>
          <h2 className="text-4xl md:text-5xl font-black">Choose Your <span className="gold-text">Plan</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(p => (
            <div key={p.name} className={`card-dark p-6 flex flex-col hover:-translate-y-1 transition-all ${p.popular ? 'border-[#c9a84c]/50' : ''}`}>
              {p.popular && <div className="text-xs font-bold text-[#0a0a14] bg-[#c9a84c] px-3 py-1 rounded-full self-start mb-4">Most Popular</div>}
              <h3 className="font-black text-lg mb-1" style={{ color: p.color }}>{p.name}</h3>
              <div className="text-4xl font-black my-3">{p.roi}</div>
              <div className="text-gray-500 text-xs mb-4">Total return at maturity</div>
              <div className="space-y-2 text-sm mb-6 flex-1">
                <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold">{p.duration}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Min</span><span className="font-semibold">{p.min}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Max</span><span className="font-semibold">{p.max}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Referral</span><span className="font-semibold">{p.referral}</span></div>
              </div>
              <Link href="/auth/register" className="btn-gold py-2.5 rounded-xl text-sm font-bold text-center block">
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Investor Stories</div>
            <h2 className="text-4xl font-black">What Our <span className="gold-text">Clients Say</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card-dark p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <span key={i} className="text-[#c9a84c]">★</span>)}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                    style={{ background: `${t.color}20`, border: `2px solid ${t.color}40`, color: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Got Questions?</div>
          <h2 className="text-4xl font-black">Frequently <span className="gold-text">Asked</span></h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className={`card-dark overflow-hidden transition-all ${openFaq === i ? 'border-[#c9a84c]/30' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left">
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <ChevronDown size={18} className={`text-[#c9a84c] flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-[#1e1e35] pt-4">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#c9a84c 1px,transparent 1px),linear-gradient(90deg,#c9a84c 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#c9a84c]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6">
            <Zap size={28} className="text-[#0a0a14]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Ready to <span className="gold-text">Start Earning?</span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            {t(lang, 'home.ctaSub')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-gold px-8 py-4 rounded-xl text-base flex items-center gap-2 justify-center">
              {t(lang, 'home.ctaRegister')} <ChevronRight size={18} />
            </Link>
            <Link href="/investment-plans" className="px-8 py-4 rounded-xl border border-white/20 text-gray-300 hover:border-[#c9a84c] hover:text-white transition-all flex items-center gap-2 justify-center">
              View Plans
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
