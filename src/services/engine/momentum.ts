import { utcDateKey } from '../../lib/dates'
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

function previousUtcDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const cursor = new Date(Date.UTC(year, month - 1, day))
  cursor.setUTCDate(cursor.getUTCDate() - 1)
  return cursor.toISOString().slice(0, 10)
}

function earnedOnDate(transactions: readonly Transaction[], date: string) {
  return transactions
    .filter((tx) => tx.type === 'EARN' && tx.date === date)
    .reduce((sum, tx) => sum + (Number(tx.points) || 0), 0)
}

export function currentStreak(transactions: readonly Transaction[], today = utcDateKey(), goal = 120) {
  const todayEarned = earnedOnDate(transactions, today)
  let day = todayEarned >= goal ? today : previousUtcDate(today)
  let streak = 0
  while (earnedOnDate(transactions, day) >= goal) {
    streak += 1
    day = previousUtcDate(day)
  }
  if (streak === 0 && todayEarned > 0) return 1
  return streak
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
