import type { LifetimeStats, Transaction } from '../../types'

export function earnedOn(transactions: readonly Transaction[], checkDate: string): number {
  return transactions
    .filter(
      (tx) =>
        tx.type === 'EARN' &&
        (tx.date === checkDate || (!tx.date && Boolean(tx.timestamp?.includes('Today')))),
    )
    .reduce((sum, tx) => sum + (Number(tx.points) || 0), 0)
}

export function lifetimeStats(transactions: readonly Transaction[]): LifetimeStats {
  return transactions.reduce(
    (totals, tx) =>
      tx.type === 'EARN'
        ? { earned: totals.earned + tx.points, spent: totals.spent }
        : { earned: totals.earned, spent: totals.spent + tx.points },
    { earned: 0, spent: 0 },
  )
}
