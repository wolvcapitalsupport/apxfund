import PublicHeader from '@/components/layout/PublicHeader'
import PublicFooter from '@/components/layout/PublicFooter'
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react'

const CONTACT_ITEMS = [
  {
    icon: MapPin,
    label: 'Office Address',
    value: '3536 Badger Pond Lane, Pittsburgh, PA 15212, United States',
    color: '#c9a84c',
  },
  {
    icon: Mail,
    label: 'Email Support',
    value: 'support@apxfund.xyz',
    href: 'mailto:support@apxfund.xyz',
    color: '#60a5fa',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (412) 555-0198',
    href: 'tel:+14125550198',
    color: '#34d399',
  },
  {
    icon: Clock,
    label: 'Support Hours',
    value: '24 / 7 — We never close',
    color: '#a78bfa',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#c9a84c 1px,transparent 1px),linear-gradient(90deg,#c9a84c 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#c9a84c]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-4">Get In Touch</div>
          <h1 className="text-5xl md:text-6xl font-black mb-5">
            Contact <span className="gold-text">Us</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Our team is available around the clock. Reach out through any channel below and we will respond promptly.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {CONTACT_ITEMS.map(({ icon: Icon, label, value, href, color }) => (
            <div key={label} className="card-dark p-6 hover:border-[#c9a84c]/40 transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</div>
              {href ? (
                <a href={href} className="text-sm font-semibold text-white hover:text-[#c9a84c] transition-colors leading-relaxed">
                  {value}
                </a>
              ) : (
                <div className="text-sm font-semibold leading-relaxed">{value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Two column: form + info */}
        <div className="grid lg:grid-cols-2 gap-10">

          {/* Contact form */}
          <div className="card-dark p-8">
            <h2 className="text-xl font-black mb-1">Send Us a Message</h2>
            <p className="text-gray-500 text-sm mb-7">We typically respond within 1 hour.</p>
            <form action={`mailto:support@apxfund.xyz`} method="GET" className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
                  <input type="text" name="name" placeholder="John Doe" required
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
                  <input type="email" name="email" placeholder="you@example.com" required
                    className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Subject</label>
                <input type="text" name="subject" placeholder="How can we help?" required
                  className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Message</label>
                <textarea name="body" rows={5} placeholder="Describe your question or issue in detail..." required
                  className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a84c] transition-colors resize-none" />
              </div>
              <button type="submit"
                className="w-full btn-gold py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 group">
                Send Message
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div className="space-y-5">
            {/* Live chat callout */}
            <div className="card-dark p-6 border-green-400/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-bold text-sm">Live Chat — Online Now</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                The fastest way to reach us. Click the chat bubble in the bottom-right corner to connect with a support agent instantly.
              </p>
              <div className="text-xs text-gray-600">Average response time: <span className="text-white font-semibold">&lt; 2 minutes</span></div>
            </div>

            {/* FAQ callout */}
            <div className="card-dark p-6">
              <h3 className="font-bold mb-3">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {[
                  { q: 'How long does a deposit take?', a: 'Deposits are reviewed and credited within 30 minutes of submission.' },
                  { q: 'How do I withdraw my earnings?', a: 'Navigate to Dashboard → Withdraw. Processed within 24 hours.' },
                  { q: 'Is KYC mandatory?', a: 'KYC is required to unlock full investment limits and withdrawals.' },
                  { q: 'What currencies do you accept?', a: 'BTC, ETH, USDT (TRC-20), and USDC (Arbitrum One).' },
                ].map(({ q, a }) => (
                  <div key={q} className="border-b border-[#1e1e35] pb-4 last:border-0 last:pb-0">
                    <div className="text-sm font-semibold mb-1">{q}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
