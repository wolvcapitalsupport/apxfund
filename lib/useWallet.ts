import { useState, useEffect, useCallback } from "react";
import { getProvider, getApxContract, formatApx, parseApx, APX_CONTRACT_ADDRESS } from "./web3";

export interface Wallet {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface UseWalletReturn {
  wallet: Wallet;
  connect: () => Promise<void>;
  disconnect: () => void;
  getApxBalance: () => Promise<string>;
  switchToBsc: () => Promise<void>;
}

export const useWallet = (): UseWalletReturn => {
  const [wallet, setWallet] = useState<Wallet>({
    address: null,
    isConnected: false,
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isConnecting: true }));

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask or WalletConnect to use this feature");
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];

      // Switch to BSC network if not already on it
      await switchToBsc();

      setWallet({
        address,
        isConnected: true,
        isConnecting: false,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setWallet((prev) => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      isConnected: false,
      isConnecting: false,
    });
  }, []);

  const getApxBalance = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) {
      return "0";
    }

    try {
      const provider = getProvider();
      const apxContract = getApxContract(provider);
      const balance = await apxContract.balanceOf(wallet.address);
      return formatApx(balance);
    } catch (error) {
      console.error("Failed to get APX balance:", error);
      return "0";
    }
  }, [wallet.isConnected, wallet.address]);

  const switchToBsc = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask or WalletConnect to use this feature");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    } catch (switchError: any) {
      // If the chain hasn't been added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x38",
              chainName: "Binance Smart Chain",
              nativeCurrency: {
                name: "Binance Coin",
                symbol: "BNB",
                decimals: 18,
              },
              rpcUrls: ["https://bsc-dataseed1.binance.org"],
              blockExplorerUrls: ["https://bscscan.com"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          disconnect();
        } else if (accounts[0] !== wallet.address) {
          // User switched accounts
          setWallet((prev) => ({
            ...prev,
            address: accounts[0],
          }));
        }
      };

      const handleChainChanged = () => {
        // Optionally reload or handle chain change
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [disconnect, wallet.address]);

  return {
    wallet,
    connect,
    disconnect,
    getApxBalance,
    switchToBsc,
  };
};