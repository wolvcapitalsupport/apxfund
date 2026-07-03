// ── Plan hierarchy rules ──────────────────────────────────────────────
// Single source of truth for the Starter → Growth → Apex → Sovereign
// migration logic. Plan identity is matched on `name` (same convention
// already used in components/UpgradeBanner.tsx) since plans are seeded
// data, not enum values.

export const STARTER_PLAN_NAME = 'Starter Portfolio'
export const MAX_STARTER_CYCLES = 2

// Ordered tier list — index order defines "next plan" for migration.
export const PLAN_TIERS = ['Starter Portfolio', 'Growth Fund', 'Apex Fund', 'Sovereign Tier'] as const

export function isStarterPlan(planName: string) {
  return planName === STARTER_PLAN_NAME
}

// Plans a Starter Portfolio graduate can migrate into, in display order.
export function getMigrationTargets(plans: { id: string; name: string; minAmount: number }[]) {
  return PLAN_TIERS.slice(1)
    .map(name => plans.find(p => p.name === name))
    .filter((p): p is { id: string; name: string; minAmount: number } => !!p)
}

// Given locked capital and the catalog of plans, compute exact top-up
// needed for each plan above Starter Portfolio.
export function computeMigrationOptions(
  lockedCapital: number,
  plans: { id: string; name: string; minAmount: number }[]
) {
  return getMigrationTargets(plans).map(plan => ({
    planId: plan.id,
    planName: plan.name,
    minAmount: plan.minAmount,
    topUpNeeded: Math.max(0, parseFloat((plan.minAmount - lockedCapital).toFixed(2))),
  }))
}
