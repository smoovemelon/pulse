import type { Transaction } from '../../types'

export function isLockedTransaction(tx: Transaction): boolean {
  return tx.is_locked === true || (tx.type === 'SPEND' && tx.category === 'Decay Audit')
}

export function balanceAfterRemoval(balance: number, tx: Transaction): number {
  if (isLockedTransaction(tx)) return balance
  const points = Number(tx.points) || 0
  const next = tx.type === 'EARN' ? balance - points : balance + points
  return Math.max(0, next)
}

export function removalShortfall(balance: number, tx: Transaction): number {
  if (isLockedTransaction(tx) || tx.type !== 'EARN') return 0
  const points = Number(tx.points) || 0
  return Math.max(0, points - Math.max(0, balance))
}
