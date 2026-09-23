import { ethers } from "ethers";

// BSC Chain Configuration
export const bscMainnet = {
  chainId: 56,
  chainName: "Binance Smart Chain",
  nativeCurrency: {
    name: "Binance Coin",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrls: ["https://bsc-dataseed1.binance.org"],
  blockExplorerUrls: ["https://bscscan.com"]
};

// APX Token Contract Address (from environment)
export const APX_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_APX_CONTRACT_ADDRESS ||
  "0x8d6032443cb7b23c134094c8921f1f37824ea3a2";

// Minimal ERC20 ABI for balanceOf, transfer, etc.
export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Create ethers provider
export const getProvider = () => {
  const rpcUrl =
    process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Create ethers signer from private key (for server-side operations)
export const getSigner = (privateKey: string) => {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
};

// Get APX token contract instance
export const getApxContract = (signerOrProvider: any) => {
  return new ethers.Contract(APX_CONTRACT_ADDRESS, ERC20_ABI, signerOrProvider);
};

// Utility to format APX tokens (18 decimals)
export const formatApx = (amount: bigint | number): string => {
  const amountBig = typeof amount === "bigint" ? amount : BigInt(amount);
  return ethers.formatUnits(amountBig, 18);
};

// Utility to parse APX tokens (to 18 decimals)
export const parseApx = (amount: string | number): bigint => {
  return ethers.parseUnits(amount.toString(), 18);
};