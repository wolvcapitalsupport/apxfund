import { TransactionStatus } from '@prisma/client'

export type InsightSnapshot = {
  balance: number
  totalProfit: number
  totalDeposited: number
  totalWithdrawn: number
  activeInvestments: number
  completedInvestments: number
  pendingWithdrawals: number
  apxBalance: number
  apxRewards: number
  weeklyProfit: number
  weeklyDeposits: number
  weeklyWithdrawals: number
}

export function buildSnapshot(user: any, transactions: any[]): InsightSnapshot {
  const activeInvestments = (user.investments || []).filter((i: any) => i.status === 'ACTIVE').length
  const completedInvestments = (user.investments || []).filter((i: any) => i.status === 'COMPLETED').length
  const pendingWithdrawals = transactions.filter((t: any) => t.type === 'WITHDRAWAL' && t.status === 'PENDING').length

  const weekly = transactions.filter((t: any) => t.status === TransactionStatus.APPROVED)
  const weeklyProfit = weekly.filter((t: any) => t.type === 'PROFIT').reduce((s: number, t: any) => s + t.amount, 0)
  const weeklyDeposits = weekly.filter((t: any) => t.type === 'DEPOSIT').reduce((s: number, t: any) => s + t.amount, 0)
  const weeklyWithdrawals = weekly.filter((t: any) => t.type === 'WITHDRAWAL').reduce((s: number, t: any) => s + t.amount, 0)

  return {
    balance: Number(user.balance || 0),
    totalProfit: Number(user.totalProfit || 0),
    totalDeposited: Number(user.totalDeposited || 0),
    totalWithdrawn: Number(user.totalWithdrawn || 0),
    activeInvestments,
    completedInvestments,
    pendingWithdrawals,
    apxBalance: Number(user.apxBalance || 0),
    apxRewards: Number(user.apxRewards || 0),
    weeklyProfit,
    weeklyDeposits,
    weeklyWithdrawals,
  }
}

export function computeScore(snapshot: InsightSnapshot) {
  let score = 45

  if (snapshot.activeInvestments > 0) score += 20
  if (snapshot.completedInvestments > 0) score += 10
  if (snapshot.weeklyProfit > 0) score += 10
  if (snapshot.totalProfit > 100) score += 5
  if (snapshot.pendingWithdrawals > 0) score -= 8
  if (snapshot.weeklyWithdrawals > snapshot.weeklyDeposits) score -= 6

  score = Math.max(0, Math.min(100, Math.round(score)))

  let label = 'Stable'
  if (score >= 75) label = 'Strong Growth'
  else if (score >= 55) label = 'Healthy'
  else if (score < 40) label = 'At Risk'

  return { score, label }
}

export function deterministicAction(snapshot: InsightSnapshot) {
  if (snapshot.activeInvestments === 0 && snapshot.balance >= 200) {
    return 'Deploy idle balance into an active plan to restore compounding momentum.'
  }
  if (snapshot.pendingWithdrawals > 0) {
    return 'Keep pending withdrawal minimal and preserve at least one active cycle for growth continuity.'
  }
  if (snapshot.weeklyProfit > 0 && snapshot.balance > 0) {
    return 'Reinvest part of available balance to compound recent weekly gains.'
  }
  return 'Maintain one active plan and review APX accumulation weekly for disciplined growth.'
}
