export const APX_SUPPLY = 5_000_000_000
export const APX_BUY_RATE = 0.0008        // rate investors buy APX with balance
export const APX_EARNINGS_RATE = 0.0008   // rate used to convert earnings → APX
export const APX_REDEMPTION_RATE = 0.00072
export const APX_REWARD_SHARE = 0.08      // kept for tokenomics display — not used in ROI engine

// Minimum redemption enforced at $1,000 USD equivalent
// $1,000 / $0.00072 = 1,388,889 APX (rounded up)
export const APX_MIN_REDEMPTION_USD = 1_000
export const APX_MIN_REDEMPTION_APX = Math.ceil(APX_MIN_REDEMPTION_USD / APX_REDEMPTION_RATE) // 1,388,889

export function usdToApx(usd: number, rate = APX_BUY_RATE) {
  if (!usd || usd <= 0) return 0
  return usd / rate
}

export function apxToUsd(apx: number, rate = APX_REDEMPTION_RATE) {
  if (!apx || apx <= 0) return 0
  return apx * rate
}

/**
 * Convert a USD profit amount into an APX allocation.
 * Returns all three values so every call site can store them durably.
 * Rate is locked at call time — never mutate historical allocations.
 */
export function profitToApxAllocation(usdProfit: number, rate = APX_EARNINGS_RATE): {
  usdAmount: number
  conversionRate: number
  apxAmount: number
} {
  const apxAmount = usdProfit > 0 ? parseFloat((usdProfit / rate).toFixed(8)) : 0
  return { usdAmount: usdProfit, conversionRate: rate, apxAmount }
}

export function formatApx(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

