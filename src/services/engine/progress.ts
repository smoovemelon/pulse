import { localDateKey, shiftDateKey } from '../../lib/dates'
import type { Transaction } from '../../types'
import { forgeTarget } from './forge'
import { earnedOn } from './momentum'

export interface ProgressDay {
  readonly date: string
  readonly label: string
  readonly earned: number
  readonly spent: number
  readonly goal: number
  readonly onTarget: boolean
}

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

function spentOn(transactions: readonly Transaction[], date: string) {
  return transactions
    .filter((tx) => tx.type === 'SPEND' && tx.date === date)
    .reduce((sum, tx) => sum + (Number(tx.points) || 0), 0)
}

export function progressWindow(transactions: readonly Transaction[], days = 14, today = localDateKey()): readonly ProgressDay[] {
  const count = Math.max(1, Math.floor(days))
  return Array.from({ length: count }, (_, index) => {
    const date = shiftDateKey(today, index - (count - 1))
    const [year, month, day] = date.split('-').map(Number)
    const earned = earnedOn(transactions, date)
    const goal = forgeTarget(transactions, date)
    return {
      date,
      label: WEEKDAY[new Date(year, month - 1, day).getDay()] ?? 'M',
      earned,
      spent: spentOn(transactions, date),
      goal,
      onTarget: earned >= goal,
    }
  })
}
