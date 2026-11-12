'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Copy, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '@/lib/useLang'

const APX_SYMBOL = 'APX'
const APX_DECIMALS = 18
const BSC_CHAIN_ID = 56
const BSC_TRUST_WALLET_COIN = '20000714'
const CHECKSUMMED_APX_CONTRACT = '0x8d6032443cb7B23c134094c8921F1F37824EA3a2'

type GuideCopy = {
  title: string
  intro: string
  internalTitle: string
  internalText: string
  addTitle: string
  addText: string
  addButton: string
  copyButton: string
  copied: string
  details: string
  network: string
  contract: string
  symbol: string
  decimals: string
  stepsTitle: string
  steps: string[]
  safety: string
  safetyText: string
  explorer: string
  notAvailable: string
}

const COPY: Record<'en' | 'de', GuideCopy> = {
  en: {
    title: 'Bring APX into view',
    intro: 'APX is the token used for APXFund rewards. Add it to Trust Wallet once, then keep your token details close at hand.',
    internalTitle: 'Know what you are holding',
    internalText: 'Your APXFund reward balance is tracked inside APXFund. Adding APX to Trust Wallet only displays the token in that wallet; it does not move your APXFund reward balance. To receive a payout, enter your BNB Smart Chain receiving address in the withdrawal form below. Never enter the APX token contract address as your receiving address.',
    addTitle: 'Add APX automatically',
    addText: 'Connect your wallet above, then use the button below. Your wallet will show its own confirmation request.',
    addButton: 'Add APX to connected wallet',
    copyButton: 'Copy',
    copied: 'Copied',
    details: 'If the automatic button is not available',
    network: 'Network',
    contract: 'Contract address',
    symbol: 'Token symbol',
    decimals: 'Decimals',
    stepsTitle: 'Simple manual steps',
    steps: [
      'Open Trust Wallet and tap the token search/manage icon.',
      'Choose BNB Smart Chain (BEP-20).',
      'Tap Add Custom Token, then paste the contract address below.',
      'Check that the symbol is APX and decimals are 18, then tap Import.',
    ],
    safety: 'Safety check',
    safetyText: 'Only use the contract address shown here or on the official APXFund website. APXFund will never ask for your recovery phrase, private key, or wallet password.',
    explorer: 'Verify on BscScan',
    notAvailable: 'Your wallet did not show the add-token request. Use the Trust Wallet button or the manual steps below.',
  },
  de: {
    title: 'APX sichtbar machen',
    intro: 'APX ist der Token für APXFund-Belohnungen. Fügen Sie ihn einmal zu Trust Wallet hinzu und behalten Sie die Token-Details im Blick.',
    internalTitle: 'Wissen, was Sie halten',
    internalText: 'Ihr APXFund-Belohnungsguthaben wird innerhalb von APXFund geführt. Das Hinzufügen von APX zu Trust Wallet zeigt nur den Token in dieser Wallet an. Für eine Auszahlung geben Sie unten Ihre BNB-Smart-Chain-Empfangsadresse ein. Verwenden Sie niemals die APX-Contract-Adresse als Empfangsadresse.',
    addTitle: 'APX automatisch hinzufügen',
    addText: 'Verbinden Sie zuerst Ihre Wallet. Tippen Sie anschließend auf die Schaltfläche und bestätigen Sie die Anfrage Ihrer Wallet.',
    addButton: 'APX zu dieser Wallet hinzufügen',
    copyButton: 'Kopieren',
    copied: 'Kopiert',
    details: 'Wenn das automatische Hinzufügen nicht verfügbar ist',
    network: 'Netzwerk',
    contract: 'Contract-Adresse',
    symbol: 'Token-Symbol',
    decimals: 'Dezimalstellen',
    stepsTitle: 'Einfache manuelle Schritte',
    steps: [
      'Öffnen Sie Trust Wallet und tippen Sie auf das Symbol zum Suchen/Verwalten von Tokens.',
      'Wählen Sie BNB Smart Chain (BEP-20).',
      'Tippen Sie auf „Benutzerdefinierten Token hinzufügen“ und fügen Sie die Contract-Adresse ein.',
      'Prüfen Sie APX und 18 Dezimalstellen und tippen Sie auf Importieren.',
    ],
    safety: 'Sicherheitsprüfung',
    safetyText: 'Verwenden Sie nur die hier angezeigte Contract-Adresse oder die offizielle APXFund-Website. APXFund fragt niemals nach Ihrer Wiederherstellungsphrase, Ihrem Private Key oder Ihrem Wallet-Passwort.',
    explorer: 'Auf BscScan prüfen',
    notAvailable: 'Ihre Wallet hat die Anfrage zum Hinzufügen nicht angezeigt. Verwenden Sie die Trust-Wallet-Schaltfläche oder die manuellen Schritte.',
  },
}

type WalletProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

export default function ApxWalletGuide({ walletProvider }: { walletProvider?: WalletProvider | null }) {
  const { lang } = useLang()
  const copy = COPY[lang]
  const [open, setOpen] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const details = useMemo(() => [
    [copy.network, 'BNB Smart Chain (BEP-20)'],
    [copy.contract, CHECKSUMMED_APX_CONTRACT],
    [copy.symbol, APX_SYMBOL],
    [copy.decimals, String(APX_DECIMALS)],
  ], [copy])

  const copyValue = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    window.setTimeout(() => setCopiedField(null), 1800)
  }

  const openTrustWalletAsset = () => {
    const asset = `c${BSC_TRUST_WALLET_COIN}_t${CHECKSUMMED_APX_CONTRACT}`
    const trustWalletUrl = `https://link.trustwallet.com/add_asset?asset=${encodeURIComponent(asset)}`
    toast(copy.copied === 'Copied' ? 'Opening Trust Wallet to add APX…' : 'Trust Wallet zum Hinzufügen von APX wird geöffnet…')
    window.location.assign(trustWalletUrl)
  }

  const addToWallet = async () => {
    const provider = walletProvider || (window.ethereum as WalletProvider | undefined)
    if (provider) {
      try {
        const added = await provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: CHECKSUMMED_APX_CONTRACT,
              symbol: APX_SYMBOL,
              decimals: APX_DECIMALS,
              chainId: BSC_CHAIN_ID,
            },
          },
        })
        if (added === true) {
          toast.success(copy.copied === 'Copied' ? 'APX was added to your wallet.' : 'APX wurde zu Ihrer Wallet hinzugefügt.')
          return
        }
      } catch {
        // Some Trust Wallet mobile WalletConnect sessions reject wallet_watchAsset.
      }

      try {
        const legacyAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: CHECKSUMMED_APX_CONTRACT,
              symbol: APX_SYMBOL,
              decimals: APX_DECIMALS,
            },
          },
        })
        if (legacyAdded === true) {
          toast.success(copy.copied === 'Copied' ? 'APX was added to your wallet.' : 'APX wurde zu Ihrer Wallet hinzugefügt.')
          return
        }
      } catch {
        // Fall through to Trust Wallet's native add-asset route.
      }
    }

    openTrustWalletAsset()
  }

  return (
    <section id="trust-wallet-guide" className="premium-surface relative mb-6 overflow-hidden rounded-[22px] p-5 sm:p-6" aria-labelledby="apx-guide-title">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#e8cc7a] to-transparent opacity-60" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9a84c]/15 text-[#EAB308]">
          <ShieldCheck size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="apx-guide-title" className="luxury-display text-2xl font-semibold text-white">{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">{copy.intro}</p>
        </div>
        <button type="button" onClick={() => setOpen(value => !value)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white" aria-expanded={open} aria-controls="apx-guide-content">
          <ChevronDown size={19} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && <div id="apx-guide-content" className="mt-5 space-y-5">
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-4">
          <p className="text-sm font-bold text-blue-200">{copy.internalTitle}</p>
          <p className="mt-1 text-xs leading-5 text-blue-100/70">{copy.internalText}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#1e1e35] bg-[#0a0a14] p-4">
            <div className="flex items-center gap-2 text-white"><Smartphone size={17} className="text-[#EAB308]" /><h3 className="font-bold">{copy.addTitle}</h3></div>
            <p className="mt-2 text-xs leading-5 text-gray-400">{copy.addText}</p>
            <button type="button" onClick={addToWallet} className="mt-4 w-full rounded-xl bg-[#EAB308] px-4 py-3 text-sm font-black text-[#090A0F] hover:bg-[#facc15]">{copy.addButton}</button>
          </div>

          <div className="rounded-xl border border-[#1e1e35] bg-[#0a0a14] p-4">
            <h3 className="font-bold text-white">{copy.details}</h3>
            <div className="mt-3 space-y-2">
              {details.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                <span className="shrink-0 text-gray-500">{label}</span>
                <span className="flex min-w-0 items-center gap-2 text-right font-mono text-gray-200"><span className="truncate">{value}</span>{label === copy.contract && <button type="button" onClick={() => copyValue(label, value)} className="shrink-0 text-[#c9a84c]" aria-label={`${copy.copyButton} ${label}`}>{copiedField === label ? <Check size={14} /> : <Copy size={14} />}</button>}</span>
              </div>)}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">{copy.stepsTitle}</h3>
          <ol className="mt-3 grid gap-2 text-xs leading-5 text-gray-400 sm:grid-cols-2">
            {copy.steps.map((step, index) => <li key={step} className="flex gap-2 rounded-lg border border-[#1e1e35] bg-[#0a0a14] p-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/15 text-[10px] font-black text-[#EAB308]">{index + 1}</span><span>{step}</span></li>)}
          </ol>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold text-emerald-200">{copy.safety}</p><p className="mt-1 text-xs leading-5 text-emerald-100/70">{copy.safetyText}</p></div>
          <a href={`https://bscscan.com/token/${CHECKSUMMED_APX_CONTRACT}`} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-300 hover:underline">{copy.explorer}<ExternalLink size={13} /></a>
        </div>
      </div>}
    </section>
  )
}
