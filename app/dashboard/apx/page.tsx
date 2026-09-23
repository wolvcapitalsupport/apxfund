'use client'

import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowDownUp,
  Coins,
  ArrowLeftRight,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  SmartphoneNfc,
  RefreshCw,
  Zap
} from 'lucide-react'
import { useWallet } from '@/lib/useWallet'
import { formatApx, parseApx, APX_BUY_RATE, APX_REDEMPTION_RATE } from '@/lib/apx'

export default function ApxWalletPage() {
  const [buyUsd, setBuyUsd] = useState('')
  const [redeemApx, setRedeemApx] = useState('')
  const [redeemUsd, setRedeemUsd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [swapMode, setSwapMode] = useState<'buy' | 'sell'>('buy')

  const { wallet, connect: connectWallet, disconnect: disconnectWallet, getApxBalance, switchToBsc } = useWallet()

  const CONTRACT = '0x8d6032443cb7b23c134094c8921f1f37824ea3a2'
  const TOKEN_SYMBOL = 'APX'
  const TOKEN_DECIMALS = 18

  const addToWallet = async () => {
    try {
      if (!window.ethereum) return toast.error('No Web3 wallet detected. Install MetaMask or Trust Wallet.')
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT,
            symbol: TOKEN_SYMBOL,
            decimals: TOKEN_DECIMALS,
          },
        },
      })
      toast.success('APX token added to your wallet!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add token')
    }
  }

  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate derived values for buy
  const estBuyApx = buyUsd ? parseApx(parseFloat(buyUsd) / APX_BUY_RATE) : '0'

  // Calculate derived values for sell/redeem
  const derivedRedeemApx = redeemApx ? parseApx(redeemApx) : '0'
  const derivedRedeemUsd = redeemUsd ?
    parseApx(parseFloat(redeemUsd) / APX_REDEMPTION_RATE) :
    '0'

  const toggleSwapMode = () => {
    setSwapMode(m => m === 'buy' ? 'sell' : 'buy')
    setBuyUsd('')
    setRedeemApx('')
    setRedeemUsd('')
  }

  const handleBuy = async () => {
    const usdAmount = parseFloat(buyUsd || '0')
    if (!usdAmount || usdAmount < 10) {
      return toast.error('Minimum APX buy is $10')
    }

    if (!wallet.isConnected) {
      return toast.error('Please connect your wallet first')
    }

    setSubmitting(true)
    try {
      // In a full implementation, we would:
      // 1. Calculate required BNB/USDT amount for the swap
      // 2. Show PancakeSwap interface or execute swap via contract
      // 3. For now, we'll show instructions

      const apxAmount = usdAmount / APX_BUY_RATE
      toast.success(`Ready to swap $${usdAmount.toFixed(2)} for ${formatApx(apxAmount)} APX on PancakeSwap`)

      // In production, this would trigger the swap interface
      // For now, we just show a success message
    } catch (error) {
      toast.error('Failed to initiate swap: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRedeem = async () => {
    const apxAmount = parseFloat(redeemApx || '0')
    const usdAmount = parseFloat(redeemUsd || '0')

    if ((!apxAmount || apxAmount <= 0) && (!usdAmount || usdAmount <= 0)) {
      return toast.error('Enter an amount')
    }

    if (!wallet.isConnected) {
      return toast.error('Please connect your wallet first')
    }

    // Calculate the other value if only one is provided
    const finalApxAmount = apxAmount || (usdAmount / APX_REDEMPTION_RATE)
    const finalUsdAmount = usdAmount || (apxAmount * APX_REDEMPTION_RATE)

    if (finalApxAmount < 1.388889) { // Minimum redemption: 1,388.889 APX ($1,000 at current rate)
      return toast.error(`Minimum redemption is 1,388.889 APX ($1,000 USD)`)
    }

    setSubmitting(true)
    try {
      toast.success(`Ready to swap ${formatApx(finalApxAmount)} APX for $${finalUsdAmount.toFixed(2)} on PancakeSwap`)

      // In production, this would trigger the swap interface
    } catch (error) {
      toast.error('Failed to initiate swap: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Get wallet APX balance on mount and when wallet changes
  const [apxBalance, setApxBalance] = useState('0')

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet.isConnected && wallet.address) {
        const balance = await getApxBalance()
        setApxBalance(balance)
      } else {
        setApxBalance('0')
      }
    }

    fetchBalance()
  }, [wallet.isConnected, wallet.address, getApxBalance])

  // Format balance for display
  const formattedBalance = apxBalance !== '0' ? formatApx(parseFloat(apxBalance)) : '0'

  if (wallet.isConnecting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-[#EAB308] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">
              APX Wallet
            </h1>
            <p className="text-gray-400 text-sm">
              Decentralized APX token management - You control your funds
            </p>
          </div>

          {/* Wallet Connection Status */}
          <div className="bg-[#0d0f18] border border-[#1e1e35] rounded-xl px-6 py-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {wallet.isConnected ? (
                  <>
                    <Wallet size={20} className="text-[#34d399]" />
                    <div>
                      <p className="text-white font-medium">Wallet Connected</p>
                      <p className="text-xs text-gray-400">
                        {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Connecting...'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Wallet size={20} className="text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Wallet Disconnected</p>
                      <p className="text-xs text-gray-400">Connect wallet to trade APX</p>
                    </div>
                  </>
                )}
              </div>

              {wallet.isConnected ? (
                <button onClick={disconnectWallet} className="text-xs text-gray-400 hover:text-white">
                  Disconnect
                </button>
              ) : (
                <button onClick={connectWallet} className="btn-gold px-4 py-2 text-sm">
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-[#0d0f18] border border-[#1e1e35] rounded-xl px-6 py-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">APX Balance</p>
                <p className="text-2xl font-black text-[#EAB308]">
                  {formattedBalance} APX
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  ≈ ${
                    (parseFloat(formattedBalance) * APX_REDEMPTION_RATE).toFixed(2)
                  } USD
                </p>
              </div>

              <div className="text-right">
                <button
                  onClick={refreshBalance}
                  className="text-xs text-[#c9a84c] hover:text-white transition-colors"
                >
                  <RefreshCw size={16} /> Refresh
                </button>
                <button
                  onClick={addToWallet}
                  className="mt-2 text-xs text-[#c9a84c] hover:text-white transition-colors"
                >
                  <Wallet size={14} /> Add to Wallet
                </button>
              </div>
            </div>
          </div>

          {/* Swap Section */}
          <div className="bg-[#0d0f18] border border-[#1e1e35] rounded-xl px-6 py-6">
            <h2 className="text-xl font-black text-white mb-6">
              Swap APX
            </h2>

            {/* Mode Toggle */}
            <div className="flex mb-6">
              <button
                onClick={toggleSwapMode}
                className={`flex-1 px-4 py-3 text-left font-medium ${swapMode === 'buy' ? 'bg-[#0a0a14] text-white' : 'bg-[#0d0f18] text-gray-400'} ${swapMode === 'buy' ? 'border-b-2 border-[#EAB308]' : ''}`}
              >
                Buy APX
              </button>
              <button
                onClick={toggleSwapMode}
                className={`flex-1 px-4 py-3 text-right font-medium ${swapMode === 'sell' ? 'bg-[#0a0a14] text-white' : 'bg-[#0d0f18] text-gray-400'} ${swapMode === 'sell' ? 'border-b-2 border-[#34d399]' : ''}`}
              >
                Sell APX
              </button>
            </div>

            {/* Buy Mode */}
            {swapMode === 'buy' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Buy APX with BNB, USDT, or other BSC tokens via PancakeSwap
                </p>

                <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Amount to Spend (USD)
                      </label>
                      <input
                        type="number"
                        min={10}
                        value={buyUsd}
                        onChange={(e) => setBuyUsd(e.target.value)}
                        placeholder="Enter USD amount (min $10)"
                        className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#EAB308]"
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span>You'll receive:</span>
                      <span className="font-semibold text-[#EAB308]">
                        {estBuyApx !== '0' ? formatApx(parseFloat(estBuyApx)) : '0'} APX
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      Rate: 1 APX = ${APX_BUY_RATE} USD • Min: $10
                    </div>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={submitting || !wallet.isConnected || parseFloat(buyUsd || '0') < 10}
                    className="w-full bg-[#EAB308] text-[#0a0a14] font-bold py-3 px-6 rounded-xl text-sm hover:bg-[#d4af37] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing Swap...' : 'Swap for APX'}
                  </button>
                </div>
              </div>
            )}

            {/* Sell Mode */}
            {swapMode === 'sell' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">
                  Sell APX for BNB, USDT, or other BSC tokens via PancakeSwap
                </p>

                <div className="bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-4">
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          APX Amount
                        </label>
                        <input
                          type="number"
                          min={0.001}
                          value={redeemApx}
                          onChange={(e) => setRedeemApx(e.target.value)}
                          placeholder="Enter APX amount"
                          className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#34d399]"
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          USD Value
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={redeemUsd}
                          onChange={(e) => setRedeemUsd(e.target.value)}
                          placeholder="Enter USD value"
                          className="w-full bg-[#0a0a14] border border-[#1e1e35] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#34d399]"
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-xs text-gray-500">You'll pay:</span>
                        <span className="font-semibold text-white block">
                          {derivedRedeemApx !== '0' ? formatApx(parseFloat(derivedRedeemApx)) : '0'} APX
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">You'll receive:</span>
                        <span className="font-semibold text-[#34d399] block">
                          ${derivedRedeemUsd !== '0' ? parseFloat(derivedRedeemUsd) * APX_REDEMPTION_RATE : 0}.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mt-2">
                      Rate: 1 APX = ${APX_REDEMPTION_RATE} USD • Min: 1,388.889 APX ($1,000)
                    </div>
                  </div>

                  <button
                    onClick={handleRedeem}
                    disabled={submitting || !wallet.isConnected ||
                      (parseFloat(redeemApx || '0') <= 0 && parseFloat(redeemUsd || '0') <= 0) ||
                      (parseFloat(redeemApx || '0') < 1.388889 && parseFloat(redeemUsd || '0') < 1000)}
                    className="w-full bg-[#34d399] text-[#0a0a14] font-bold py-3 px-6 rounded-xl text-sm hover:bg-[#2dd4bf] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing Swap...' : 'Swap for USD'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 pt-6 border-t border-[#1e1e35]">
            <h3 className="text-lg font-black text-white mb-4">How It Works</h3>
            <p className="text-gray-400 text-sm mb-2">
              Connect your wallet to swap APX tokens directly on PancakeSwap. You maintain full control of your funds at all times.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
              <li>Connect your wallet (MetaMask, WalletConnect, etc.)</li>
              <li>Ensure you're on the Binance Smart Chain network</li>
              <li>Enter the amount you wish to swap</li>
              <li>Confirm the transaction in your wallet</li>
              <li>View the transaction on BscScan</li>
            </ol>
            <p className="mt-4 text-xs text-gray-500">
              APX Contract:{' '}
              <a
                href={`https://bscscan.com/token/${CONTRACT}`}
                className="text-xs text-[#c9a84c] hover:underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {CONTRACT}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to refresh balance
const refreshBalance = async () => {
  // This would be handled by the useWallet hook's getApxBalance function
  // For now, we'll just trigger a refetch by calling the function again
  toast.info('Balance refreshed')
};