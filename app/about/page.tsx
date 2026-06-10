import Image from 'next/image'
import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { CheckCircle, ArrowRight, Users, DollarSign, Globe, TrendingUp } from 'lucide-react'

const MILESTONES = [
  { year: '2016', event: 'APXFund founded. Initial trading in stocks, shares, and bonds.' },
  { year: '2018', event: 'Expanded into Forex trading markets. First international office opened.' },
  { year: '2019', event: 'Entered cryptocurrency trading. Among pioneer institutional BTC traders.' },
  { year: '2021', event: 'Reached $10M total investor payouts. Team expanded to 80+ professionals.' },
  { year: '2023', event: 'Launched hedge fund marketplace and escrow services division.' },
  { year: '2025', event: '$48M+ paid to investors. 14,000+ active clients across 120 countries.' },
]

const VALUES = [
  { title: 'Transparency',   desc: 'Every transaction and position is visible to our clients in real time. No hidden fees, no surprises.' },
  { title: 'Security',       desc: 'Military-grade encryption, multi-factor authentication, and cold-storage asset protection.' },
  { title: 'Performance',    desc: 'Quantitative strategies rigorously back-tested across decades of market data.' },
  { title: 'Accountability', desc: 'Our leadership team has skin in the game — directors own approximately 98% of the company.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      {/* Page hero */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80&auto=format&fit=crop"
            alt="About hero" fill className="object-cover opacity-20" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a14]/60 via-[#0a0a14]/80 to-[#0a0a14]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Who We Are</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">About <span className="gold-text">APXFund</span></h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            A globally trusted asset management company delivering institutional-quality returns to everyday investors since 2016.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Our Story</div>
            <h2 className="text-4xl font-black mb-6 leading-tight">Built on <span className="gold-text">Expertise & Trust</span></h2>
            <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
              <p>APXFund is a United States-based Asset and Stock Management Company with affiliates in Europe, Asia, and the Middle East. We are dedicated to managing our clients&apos; portfolios with unmatched precision.</p>
              <p>Our deep sector knowledge and unrivaled insight into the private fund market allows us to raise capital profitably and efficiently. We thrive on working alongside the most innovative funds and consistently partner with the highest-quality fund managers.</p>
              <p>We employ over 130 professionals and invest heavily in the ongoing research-driven evolution of our quantitative alpha-generating systems across a wide range of liquid asset classes. The company emphasises strong corporate governance and first-class investor service.</p>
              <p>Our directors, together with employees and the Employee Benefit Trust, currently own approximately 98% of the company — giving every member of our team a personal stake in your success.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden h-64">
              <Image src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80&auto=format&fit=crop"
                alt="APXFund office" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '130+', label: 'Professionals', icon: Users },
                { value: '$48M+', label: 'Paid Out', icon: DollarSign },
                { value: '120+', label: 'Countries', icon: Globe },
                { value: '9+', label: 'Years Active', icon: TrendingUp },
              ].map(s => (
                <div key={s.label} className="card-dark p-4 text-center">
                  <div className="text-2xl font-black gold-text">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CEO */}
      <section className="py-20 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Leadership</div>
            <h2 className="text-4xl font-black">Meet Our <span className="gold-text">CEO</span></h2>
          </div>
          <div className="max-w-3xl mx-auto card-dark p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&auto=format&fit=crop&facepad=3"
                alt="Bryce J. McFarlane" fill className="object-cover" sizes="160px" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-1">Bryce J. McFarlane</h3>
              <div className="text-[#c9a84c] font-semibold mb-4">Chief Executive Officer & Founder</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                With over 20 years in global asset management, Bryce founded APXFund with a vision to democratise access to institutional-grade investment returns. His background spans quantitative trading, hedge fund management, and regulatory compliance across US and European markets. Under his leadership, APXFund has grown from a small trading desk to a globally recognised investment platform serving clients in 120+ countries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Our Journey</div>
          <h2 className="text-4xl font-black">Company <span className="gold-text">Milestones</span></h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[#1e1e35]" />
          <div className="space-y-10">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className={`relative flex gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="flex-1 hidden md:block" />
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#c9a84c] border-4 border-[#0a0a14] z-10 mt-1" />
                <div className="flex-1 pl-10 md:pl-0">
                  <div className="card-dark p-5 hover:border-[#c9a84c]/30 transition-all">
                    <div className="gold-text font-black text-lg mb-1">{m.year}</div>
                    <p className="text-gray-400 text-sm">{m.event}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">What Drives Us</div>
            <h2 className="text-4xl font-black">Our Core <span className="gold-text">Values</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ title, desc }) => (
              <div key={title} className="card-dark p-6 hover:border-[#c9a84c]/30 transition-all">
                <CheckCircle size={24} className="text-[#c9a84c] mb-4" />
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center max-w-2xl mx-auto px-6">
        <h2 className="text-4xl font-black mb-4">Join <span className="gold-text">APXFund</span> Today</h2>
        <p className="text-gray-400 mb-8">14,000+ investors trust us with their wealth. Be part of the journey.</p>
        <Link href="/auth/register" className="btn-gold px-8 py-4 rounded-xl inline-flex items-center gap-2">
          Start Investing <ArrowRight size={18} />
        </Link>
      </section>

      <PublicFooter />
    </div>
  )
}
