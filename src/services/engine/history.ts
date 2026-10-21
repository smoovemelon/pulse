import type { Transaction } from '../../types'

export function balanceAfterRemoval(balance: number, tx: Transaction): number {
  const points = Number(tx.points) || 0
  const next = tx.type === 'EARN' ? balance - points : balance + points
  return Math.max(0, next)
}
