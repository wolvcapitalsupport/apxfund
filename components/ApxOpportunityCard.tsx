'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/useLang'

const COPY = {
  en: {
    eyebrow: 'APXFUND / APX REWARDS',
    title: 'A clearer path to your APX rewards.',
    body: 'APX gives your reward experience a visible, trackable layer. Understand what you have received, explore the ecosystem, and decide how you want to manage your APX journey.',
    points: ['Reward credits tracked in APX', 'Optional BNB Smart Chain access', 'Every wallet action stays yours to approve'],
    primary: 'Explore APX',
    secondary: 'How to add APX to Trust Wallet',
    note: 'Designed for clarity. Review every detail before you act.',
  },
  de: {
    eyebrow: 'APXFUND / APX-BELOHNUNGEN',
    title: 'Ein klarer Weg zu Ihren APX-Belohnungen.',
    body: 'APX macht Ihre Belohnungen sichtbar und nachvollziehbar. Verstehen Sie Ihr Guthaben, entdecken Sie das Ökosystem und entscheiden Sie selbst, wie Sie mit APX umgehen.',
    points: ['Belohnungen werden als APX geführt', 'Optionaler Zugang zur BNB Smart Chain', 'Jede Wallet-Aktion wird von Ihnen bestätigt'],
    primary: 'APX entdecken',
    secondary: 'APX zu Trust Wallet hinzufügen',
    note: 'Klar gestaltet. Prüfen Sie jedes Detail, bevor Sie handeln.',
  },
} as const

export default function ApxOpportunityCard() {
  const { lang } = useLang()
  const copy = COPY[lang]

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#c9a84c]/40 bg-[radial-gradient(circle_at_82%_8%,rgba(234,179,8,0.2),transparent_28%),linear-gradient(125deg,#0d1423,#11131E_58%,#1b1924)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8" aria-labelledby="apx-opportunity-title">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#e8cc7a] to-transparent opacity-70" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-[#EAB308]/15" />
      <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full border border-[#EAB308]/10" />
      <div className="relative grid gap-8 lg:grid-cols-[1.28fr_0.92fr] lg:items-center">
        <div>
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#e8cc7a]"><Sparkles size={14} />{copy.eyebrow}</div>
          <h2 id="apx-opportunity-title" className="luxury-display max-w-xl text-3xl font-semibold leading-[1.08] text-white sm:text-4xl">{copy.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{copy.body}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/dashboard/apx" className="inline-flex items-center gap-2 rounded-xl bg-[#EAB308] px-4 py-3 text-sm font-black text-[#090A0F] transition hover:bg-[#facc15]">{copy.primary}<ArrowRight size={15} /></Link>
            <Link href="/dashboard/apx#trust-wallet-guide" className="inline-flex items-center gap-2 rounded-xl border border-[#c9a84c]/40 bg-black/15 px-4 py-3 text-sm font-bold text-[#f5d77a] transition hover:bg-[#c9a84c]/10">{copy.secondary}</Link>
          </div>
          <p className="mt-4 text-[11px] tracking-wide text-slate-500">{copy.note}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#e8cc7a]/20 bg-[#070b14]/55 p-5 sm:p-6">
          <div className="pointer-events-none absolute -bottom-8 -right-4 text-[100px] font-black leading-none text-[#e8cc7a]/[0.06]">APX</div>
          <div className="relative mb-5 flex items-end justify-between border-b border-white/10 pb-4"><div><div className="text-3xl font-black tracking-[0.12em] text-[#e8cc7a]">APX</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Reward token</div></div><div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Visible</div></div>
          <div className="relative space-y-3">
            {copy.points.map(point => <div key={point} className="flex items-start gap-2.5 text-sm text-gray-200"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" /><span>{point}</span></div>)}
          </div>
          <div className="relative mt-6 border-t border-white/10 pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f5d77a]">Explore. Review. Choose.</div>
        </div>
      </div>
    </section>
  )
}
