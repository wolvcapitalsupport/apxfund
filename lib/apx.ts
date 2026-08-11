export const APX_SUPPLY = 5_000_000_000
export const APX_BUY_RATE = 0.0008
export const APX_REDEMPTION_RATE = 0.00072
export const APX_REWARD_SHARE = 0.08

export function usdToApx(usd: number, rate = APX_BUY_RATE) {
  if (!usd || usd <= 0) return 0
  return usd / rate
}

export function apxToUsd(apx: number, rate = APX_REDEMPTION_RATE) {
  if (!apx || apx <= 0) return 0
  return apx * rate
}

export function rewardApxFromProfit(profitUsd: number) {
  return usdToApx(profitUsd * APX_REWARD_SHARE, APX_BUY_RATE)
}

export function formatApx(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}