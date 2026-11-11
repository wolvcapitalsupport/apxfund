'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/useLang'

const COPY = {
  en: {
    eyebrow: 'A new way to follow your rewards',
    title: 'Your rewards can go further with APX.',
    body: 'APX is the digital token used for APXFund reward credits. Learn how it works, follow your balance, and choose how you want to manage your APX journey.',
    points: ['Rewards are clearly shown in APX', 'Optional BNB Smart Chain wallet access', 'You stay in control of every wallet action'],
    primary: 'Explore APX',
    secondary: 'How to add APX to Trust Wallet',
    note: 'No wallet is required to receive or view your APXFund reward balance.',
  },
  de: {
    eyebrow: 'Eine neue Möglichkeit, Ihre Belohnungen zu verfolgen',
    title: 'Ihre Belohnungen können mit APX weitergehen.',
    body: 'APX ist der digitale Token für APXFund-Belohnungen. Erfahren Sie, wie APX funktioniert, verfolgen Sie Ihr Guthaben und entscheiden Sie selbst, wie Sie damit umgehen.',
    points: ['Belohnungen werden klar als APX angezeigt', 'Optionaler Zugang zur BNB-Smart-Chain-Wallet', 'Sie bestätigen jede Wallet-Aktion selbst'],
    primary: 'APX entdecken',
    secondary: 'APX zu Trust Wallet hinzufügen',
    note: 'Für den Erhalt oder die Anzeige Ihrer APXFund-Belohnung ist keine Wallet erforderlich.',
  },
} as const

export default function ApxOpportunityCard() {
  const { lang } = useLang()
  const copy = COPY[lang]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#c9a84c]/45 bg-[radial-gradient(circle_at_85%_15%,rgba(234,179,8,0.18),transparent_35%),linear-gradient(120deg,#111827,#11131E_60%,#171522)] p-5 shadow-[0_18px_60px_rgba(234,179,8,0.08)] sm:p-7" aria-labelledby="apx-opportunity-title">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-[#EAB308]/20" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full border border-[#EAB308]/15" />
      <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#EAB308]"><Sparkles size={15} />{copy.eyebrow}</div>
          <h2 id="apx-opportunity-title" className="max-w-xl text-2xl font-black leading-tight text-white sm:text-3xl">{copy.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">{copy.body}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/dashboard/apx" className="inline-flex items-center gap-2 rounded-xl bg-[#EAB308] px-4 py-3 text-sm font-black text-[#090A0F] transition hover:bg-[#facc15]">{copy.primary}<ArrowRight size={15} /></Link>
            <Link href="/dashboard/apx#trust-wallet-guide" className="inline-flex items-center gap-2 rounded-xl border border-[#c9a84c]/40 bg-black/15 px-4 py-3 text-sm font-bold text-[#f5d77a] transition hover:bg-[#c9a84c]/10">{copy.secondary}</Link>
          </div>
          <p className="mt-3 text-[11px] text-gray-500">{copy.note}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">APX</div>
          <div className="space-y-3">
            {copy.points.map(point => <div key={point} className="flex items-start gap-2.5 text-sm text-gray-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" /><span>{point}</span></div>)}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4 text-xs font-bold tracking-wide text-[#f5d77a]">Explore. Review. Choose.</div>
        </div>
      </div>
    </section>
  )
}
