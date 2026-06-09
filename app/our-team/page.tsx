import Link from 'next/link'
import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { Linkedin, Twitter, ArrowRight, Shield, TrendingUp, Globe, Lock } from 'lucide-react'

const TEAM = [
  {
    name: 'Bryce J. McFarlane',
    role: 'Chief Executive Officer & Founder',
    bio: '20+ years in global asset management. Former Goldman Sachs VP. Expert in quantitative trading strategy and hedge fund operations.',
    color: '#c9a84c',
  },
  {
    name: 'Sophia Anderson',
    role: 'Chief Investment Officer',
    bio: 'Oxford-educated economist with 15 years of systematic investment strategy design. Former Head of Algo Trading at Deutsche Bank.',
    color: '#60a5fa',
  },
  {
    name: 'Daniel Owen',
    role: 'Chief Technology Officer',
    bio: 'Full-stack engineer and blockchain architect. Built trading infrastructure handling $2B+ daily volume. Former Coinbase senior engineer.',
    color: '#a78bfa',
  },
  {
    name: 'Rachel Thornton',
    role: 'Head of Forex & NFP Trading',
    bio: '12 years specialising in G10 currency pairs and macroeconomic event trading. Published author on Non-Farm Payroll strategies.',
    color: '#34d399',
  },
  {
    name: 'Marcus Chen',
    role: 'Head of Cryptocurrency Division',
    bio: 'Early Bitcoin adopter turned institutional crypto strategist. Former Binance institutional desk lead. CFA Charterholder.',
    color: '#f97316',
  },
  {
    name: 'Fatima Al-Rashid',
    role: 'Head of Client Relations',
    bio: 'Multilingual investor relations specialist with 10 years managing HNW portfolios across Middle East and European markets.',
    color: '#f472b6',
  },
  {
    name: 'James Ellis',
    role: 'Head of Compliance & Risk',
    bio: 'Former SEC examiner with deep expertise in financial regulation, AML compliance, and institutional risk frameworks.',
    color: '#38bdf8',
  },
  {
    name: 'Elena Vasquez',
    role: 'Senior Quantitative Analyst',
    bio: 'PhD in Mathematical Finance from MIT. Specialises in derivatives pricing models and high-frequency trading algorithms.',
    color: '#c9a84c',
  },
]

const DEPARTMENTS = [
  { name: 'Trading & Investments',   count: 42, icon: '📈' },
  { name: 'Technology & Engineering', count: 28, icon: '💻' },
  { name: 'Client Relations',         count: 22, icon: '🤝' },
  { name: 'Compliance & Risk',        count: 18, icon: '🛡️' },
  { name: 'Operations',               count: 14, icon: '⚙️' },
  { name: 'Research & Analytics',     count: 10, icon: '🔬' },
]

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('')
  return (
    <div className="w-full h-52 flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)` }}>
      <div className="w-24 h-24 rounded-2xl flex items-center justify-center border-2"
        style={{ background: `${color}20`, borderColor: `${color}40` }}>
        <span className="text-3xl font-black" style={{ color }}>{initials}</span>
      </div>
    </div>
  )
}

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      {/* Page hero — no image */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#c9a84c 1px,transparent 1px),linear-gradient(90deg,#c9a84c 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a84c]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">The People Behind the Returns</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Our <span className="gold-text">Team</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            130+ professionals united by a shared mission — to deliver exceptional investment returns with full transparency.
          </p>
        </div>
      </section>

      {/* Department stats */}
      <section className="py-16 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DEPARTMENTS.map(d => (
              <div key={d.name} className="card-dark p-4 text-center hover:border-[#c9a84c]/30 transition-all">
                <div className="text-2xl mb-2">{d.icon}</div>
                <div className="font-black text-xl gold-text">{d.count}</div>
                <div className="text-gray-500 text-xs mt-1 leading-snug">{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team grid */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Leadership</div>
          <h2 className="text-4xl font-black">Meet the <span className="gold-text">Experts</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map(member => (
            <div key={member.name}
              className="group card-dark overflow-hidden hover:border-[#c9a84c]/40 transition-all hover:-translate-y-1">
              <Avatar name={member.name} color={member.color} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base mb-0.5">{member.name}</h3>
                    <div className="text-xs font-semibold" style={{ color: member.color }}>{member.role}</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 rounded-lg bg-[#1e1e35] flex items-center justify-center cursor-pointer hover:bg-[#c9a84c]/20">
                      <Linkedin size={11} className="text-[#c9a84c]" />
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-[#1e1e35] flex items-center justify-center cursor-pointer hover:bg-[#c9a84c]/20">
                      <Twitter size={11} className="text-[#c9a84c]" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Join the team */}
      <section className="py-20 bg-[#12121f] border-y border-[#1e1e35]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-4">Want to <span className="gold-text">Join Us?</span></h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            We're always looking for exceptional traders, engineers, and financial analysts to join our growing team.
          </p>
          <a href="mailto:careers@apxfund.xyz"
            className="btn-gold px-8 py-3.5 rounded-xl inline-flex items-center gap-2 font-bold">
            Apply Now <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
