import type { Transaction } from '../../types'

export const FORGE_BASELINE = 120
export const FORGE_MIN = 80
export const FORGE_MAX = 180

function isJudgedEarn(tx: Transaction): boolean {
  return tx.type === 'EARN' && tx.reasoning !== 'Habit deck bounty'
}

export function forgeTarget(transactions: readonly Transaction[], day: string): number {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (!isJudgedEarn(tx) || !tx.date || tx.date >= day) continue
    totals.set(tx.date, (totals.get(tx.date) ?? 0) + tx.points)
  }
  const active = [...totals.entries()]
    .filter(([, points]) => points > 0)
    .map(([date]) => date)
    .sort()
    .slice(-7)
  if (active.length === 0) return FORGE_BASELINE
  const values = active.map((date) => totals.get(date) ?? 0).sort((a, b) => a - b)
  const mid = Math.floor(values.length / 2)
  const median = values.length % 2 === 1 ? values[mid] : ((values[mid - 1] ?? 0) + (values[mid] ?? 0)) / 2
  return Math.min(FORGE_MAX, Math.max(FORGE_MIN, Math.round(median)))
}

export function graceFloor(target: number): number {
  return target * 0.5
}
