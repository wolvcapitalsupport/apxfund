'use client'

import { useEffect, useState } from 'react'
import { AppKitAccountButton, AppKitConnectButton } from '@reown/appkit/react'
import { ArrowUpCircle, Check, CheckCircle2, Clock3, Copy, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatApx } from '@/lib/apx'
import { useWallet } from '@/lib/useWallet'
import { REOWN_PROJECT_ID } from '@/components/ReownProvider'
import { useLang } from '@/lib/useLang'
import ApxWalletGuide from '@/components/ApxWalletGuide'

type RequestRow = {
  id: string
  amount: number
  walletAddress: string
  network: string
  status: 'PENDING' | 'PAID' | 'REJECTED'
  txHash?: string | null
  adminNote?: string | null
  requestedAt: string
}

const copy = {
  en: {
    eyebrow: 'APX REWARDS / MANUAL PAYOUT', title: 'Withdraw your APX rewards', subtitle: 'Your APX reward is sent to the connected BNB Smart Chain wallet after an administrator confirms the payout.', available: 'Available APX rewards', destination: 'Payout wallet', connect: 'Connect wallet to continue', connected: 'Connected wallet', amount: 'APX amount to withdraw', placeholder: 'Enter APX amount', max: 'Use all available APX', submit: 'Request APX payout', submitting: 'Submitting request…', note: 'Manual payout review: an administrator sends APX from the treasury wallet, records the transaction hash, and you receive a notification.', security: 'Safety check', securityText: 'Check the wallet address and BNB Smart Chain network before submitting. APXFund will never ask for your recovery phrase or private key.', history: 'Your APX payout requests', empty: 'No APX payout requests yet.', pending: 'Pending admin payout', paid: 'Paid', rejected: 'Rejected and returned', tx: 'View transaction', setup: 'Wallet connection setup', setupText: 'Add the public Reown project ID to the deployment environment before enabling APX wallet payouts.', invalid: 'Enter a valid APX amount.', insufficient: 'The amount is greater than your available APX rewards.', connectFirst: 'Connect your wallet first.', success: 'APX payout request submitted for admin review.',
  },
  de: {
    eyebrow: 'APX-BELohnungen / MANUELLE AUSZAHLUNG', title: 'APX-Belohnungen auszahlen', subtitle: 'Ihre APX-Belohnung wird nach der Bestätigung durch den Administrator an die verbundene BNB-Smart-Chain-Wallet gesendet.', available: 'Verfügbare APX-Belohnungen', destination: 'Auszahlungs-Wallet', connect: 'Wallet verbinden', connected: 'Verbundene Wallet', amount: 'APX-Betrag', placeholder: 'APX-Betrag eingeben', max: 'Alle verfügbaren APX nutzen', submit: 'APX-Auszahlung anfordern', submitting: 'Anfrage wird gesendet…', note: 'Manuelle Prüfung: Ein Administrator sendet APX aus der Treasury-Wallet, trägt den Transaktions-Hash ein und Sie erhalten eine Benachrichtigung.', security: 'Sicherheitsprüfung', securityText: 'Prüfen Sie Wallet-Adresse und BNB-Smart-Chain-Netzwerk. APXFund fragt niemals nach Ihrer Wiederherstellungsphrase oder Ihrem Private Key.', history: 'Ihre APX-Auszahlungsanfragen', empty: 'Noch keine APX-Auszahlungsanfragen.', pending: 'Wartet auf Admin-Auszahlung', paid: 'Ausgezahlt', rejected: 'Abgelehnt und zurückgebucht', tx: 'Transaktion ansehen', setup: 'Wallet-Verbindung wird eingerichtet', setupText: 'Fügen Sie zuerst die öffentliche Reown-Projekt-ID in der Deployment-Umgebung hinzu.', invalid: 'Geben Sie einen gültigen APX-Betrag ein.', insufficient: 'Der Betrag ist höher als Ihre verfügbaren APX-Belohnungen.', connectFirst: 'Verbinden Sie zuerst Ihre Wallet.', success: 'APX-Auszahlungsanfrage zur Prüfung eingereicht.',
  },
} as const

function WithdrawalContent() {
  const { lang } = useLang()
  const text = copy[lang]
  const { wallet, walletProvider, switchToBsc } = useWallet()
  const [available, setAvailable] = useState(0)
  const [amount, setAmount] = useState('')
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)

  const load = async () => {
    const [userRes, requestRes] = await Promise.all([fetch('/api/user/me'), fetch('/api/apx/withdraw')])
    const user = await userRes.json()
    const requestData = await requestRes.json()
    setAvailable(Number(user.apxBalance || 0))
    setRequests(Array.isArray(requestData.requests) ? requestData.requests : [])
    setLoading(false)
  }

  useEffect(() => { load().catch(() => setLoading(false)) }, [])

  const copyAddress = async () => {
    if (!wallet.address) return
    await navigator.clipboard.writeText(wallet.address)
    setAddressCopied(true)
    toast.success(lang === 'de' ? 'Wallet-Adresse kopiert' : 'Wallet address copied')
    window.setTimeout(() => setAddressCopied(false), 1800)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const parsed = Number(amount)
    if (!wallet.isConnected || !wallet.address || !walletProvider) return toast.error(text.connectFirst)
    if (!Number.isFinite(parsed) || parsed <= 0) return toast.error(text.invalid)
    if (parsed > available) return toast.error(text.insufficient)

    setSubmitting(true)
    try {
      await switchToBsc()
      const response = await fetch('/api/apx/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, walletAddress: wallet.address }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to submit request')
      toast.success(text.success)
      setAmount('')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#EAB308] border-t-transparent" /></div>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#e8cc7a]">{text.eyebrow}</p>
        <h1 className="luxury-display text-4xl font-semibold text-white">{text.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{text.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="premium-surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">{text.available}</p>
          <p className="mt-2 text-3xl font-black text-[#EAB308]">{formatApx(available)} APX</p>
        </div>
        <div className="premium-surface rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">{text.destination}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            {wallet.isConnected ? <div className="flex min-w-0 items-center gap-2"><p className="truncate font-mono text-sm text-white">{wallet.address}</p><button type="button" onClick={copyAddress} className="shrink-0 rounded-lg border border-[#c9a84c]/30 p-2 text-[#e8cc7a] hover:bg-[#c9a84c]/10" title={addressCopied ? 'Copied' : 'Copy wallet address'}>{addressCopied ? <Check size={14} /> : <Copy size={14} />}</button></div> : <p className="text-sm text-gray-400">{text.connect}</p>}
            {wallet.isConnected ? <AppKitAccountButton balance="hide" /> : <AppKitConnectButton label={text.connect} loadingLabel="Opening wallet…" />}
          </div>
        </div>
      </div>

      <ApxWalletGuide walletProvider={walletProvider} />

      <form onSubmit={submit} className="premium-surface rounded-2xl p-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">{text.amount}</label>
        <div className="flex gap-3">
          <input type="number" min={0} step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder={text.placeholder} className="min-w-0 flex-1 rounded-xl border border-[#1e1e35] bg-[#0a0a14] px-4 py-3 text-white outline-none focus:border-[#c9a84c]" disabled={submitting} />
          <button type="button" onClick={() => setAmount(String(available))} className="rounded-xl border border-[#c9a84c]/30 px-4 text-xs font-bold text-[#e8cc7a] hover:bg-[#c9a84c]/10">{text.max}</button>
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-400/20 bg-blue-400/5 p-4 text-xs leading-5 text-blue-300"><ShieldCheck size={16} className="mt-0.5 shrink-0" />{text.securityText}</div>
        <p className="mt-4 text-xs leading-5 text-gray-500">{text.note}</p>
        <button type="submit" disabled={submitting || !wallet.isConnected || !amount} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FDE047] px-4 py-3 text-sm font-black text-[#090A0F] disabled:cursor-not-allowed disabled:opacity-50"><ArrowUpCircle size={17} />{submitting ? <><Loader2 size={16} className="animate-spin" />{text.submitting}</> : text.submit}</button>
      </form>

      <section className="premium-surface rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-black text-white">{text.history}</h2>
        {requests.length === 0 ? <p className="text-sm text-gray-500">{text.empty}</p> : <div className="space-y-3">{requests.map(row => (
          <div key={row.id} className="rounded-xl border border-[#1e1e35] bg-[#0a0a14] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-white">{formatApx(row.amount)} APX</p><p className="mt-1 font-mono text-xs text-gray-500">{row.walletAddress.slice(0, 8)}…{row.walletAddress.slice(-6)}</p></div><span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${row.status === 'PAID' ? 'bg-emerald-400/10 text-emerald-400' : row.status === 'REJECTED' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>{row.status === 'PAID' ? <CheckCircle2 size={13} /> : row.status === 'REJECTED' ? <XCircle size={13} /> : <Clock3 size={13} />}{row.status === 'PAID' ? text.paid : row.status === 'REJECTED' ? text.rejected : text.pending}</span></div>
            {row.txHash && <a className="mt-3 inline-block text-xs text-[#e8cc7a] hover:underline" href={`https://bscscan.com/tx/${row.txHash}`} target="_blank" rel="noreferrer">{text.tx}</a>}
            {row.adminNote && <p className="mt-2 text-xs text-gray-500">{row.adminNote}</p>}
          </div>
        ))}</div>}
      </section>
    </div>
  )
}

export default function WithdrawPage() {
  if (!REOWN_PROJECT_ID) {
    const text = copy.en
    return <div className="mx-auto max-w-xl px-6 py-12"><div className="premium-surface rounded-2xl p-8 text-center"><h1 className="luxury-display text-3xl font-semibold text-white">{text.setup}</h1><p className="mt-3 text-sm leading-6 text-gray-400">{text.setupText}</p></div></div>
  }
  return <WithdrawalContent />
}
