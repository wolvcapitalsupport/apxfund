import { useCallback } from 'react'
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
  useDisconnect,
} from '@reown/appkit/react'
import { bsc } from '@reown/appkit/networks'
import { getProvider, getApxContract, formatApx } from './web3'

export interface Wallet {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
}

export interface UseWalletReturn {
  wallet: Wallet
  walletProvider: { request: (args: { method: string; params?: unknown }) => Promise<unknown> } | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getApxBalance: () => Promise<string>
  switchToBsc: () => Promise<void>
}

export const useWallet = (): UseWalletReturn => {
  const { open } = useAppKit()
  const { disconnect: disconnectAppKit } = useDisconnect()
  const { address, isConnected, status } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId, switchNetwork } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider<{ request: (args: { method: string; params?: unknown }) => Promise<unknown> }>('eip155')

  const connect = useCallback(async () => {
    await open({ view: 'Connect' })
  }, [open])

  const disconnect = useCallback(async () => {
    await disconnectAppKit()
  }, [disconnectAppKit])

  const switchToBsc = useCallback(async () => {
    if (chainId !== bsc.id) await switchNetwork(bsc)
  }, [chainId, switchNetwork])

  const getApxBalance = useCallback(async () => {
    if (!isConnected || !address) return '0'

    try {
      const provider = getProvider()
      const apxContract = getApxContract(provider)
      const balance = await apxContract.balanceOf(address)
      return formatApx(balance)
    } catch (error) {
      console.error('Failed to get APX balance:', error)
      return '0'
    }
  }, [isConnected, address])

  return {
    wallet: {
      address: address || null,
      isConnected,
      isConnecting: status === 'connecting' || status === 'reconnecting',
    },
    walletProvider,
    connect,
    disconnect,
    getApxBalance,
    switchToBsc,
  }
}
