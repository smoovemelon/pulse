import { DAILY_GOAL, GRACE_FLOOR, utcDateKey } from '../../lib/dates'
import type { StreakState, Transaction, WeekDay } from '../../types'
import { earnedOn } from './momentum'

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

export function isStreakState(value: unknown): value is StreakState {
  return value === 'STALLED' || value === 'SAFE' || value === 'SECURED'
}

export function streakTier(earned: number, goal = DAILY_GOAL): StreakState {
  if (earned >= goal) return 'SECURED'
  if (earned >= GRACE_FLOOR) return 'SAFE'
  return 'STALLED'
}

export function advanceStreak(count: number, earned: number, goal = DAILY_GOAL) {
  const streakState = streakTier(earned, goal)
  const streakCount = streakState === 'SECURED' ? count + 1 : streakState === 'SAFE' ? count : 0
  return { streakCount, streakState }
}

export function streakMultiplier(days: number): number {
  if (days >= 14) return 1.3
  if (days >= 7) return 1.2
  if (days >= 3) return 1.1
  return 1
}

export function applyStreakBonus(points: number, days: number): number {
  return Math.round(points * streakMultiplier(days))
}

export function streakStatusMessage(todayPts: number, multiplier: number, goal = DAILY_GOAL): string {
  if (todayPts >= goal) {
    return `${goal} PTS target hit. Streak secured! ${multiplier.toFixed(1)}x bonus active.`
  }
  if (todayPts >= GRACE_FLOOR) {
    return `Safe Zone reached. Earn ${goal - todayPts} PTS to secure tomorrow's streak.`
  }
  return `Earn ${GRACE_FLOOR - todayPts} PTS to prevent decay (-15 PTS).`
}

function shiftUtcDate(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number)
  const cursor = new Date(Date.UTC(year, month - 1, day))
  cursor.setUTCDate(cursor.getUTCDate() + days)
  return cursor.toISOString().slice(0, 10)
}

function mondayOf(today: string) {
  const [year, month, day] = today.split('-').map(Number)
  const cursor = new Date(Date.UTC(year, month - 1, day))
  const weekday = cursor.getUTCDay()
  const delta = weekday === 0 ? 6 : weekday - 1
  return shiftUtcDate(today, -delta)
}

export function replayStreak(transactions: readonly Transaction[], today = utcDateKey()) {
  const dates = transactions.map((tx) => tx.date).filter((date) => date && date < today).sort()
  if (dates.length === 0) return { streakCount: 0, streakState: 'STALLED' as const }
  let cursor = dates[0]
  let streakCount = 0
  let streakState: StreakState = 'STALLED'
  while (cursor < today) {
    const next = advanceStreak(streakCount, earnedOn(transactions, cursor))
    streakCount = next.streakCount
    streakState = next.streakState
    cursor = shiftUtcDate(cursor, 1)
  }
  return { streakCount, streakState }
}

export function resolveStreak(
  count: number | undefined,
  state: unknown,
  transactions: readonly Transaction[],
  today = utcDateKey(),
) {
  if (count !== undefined && Number.isFinite(count) && count >= 0 && isStreakState(state)) {
    return { streakCount: Math.floor(count), streakState: state }
  }
  return replayStreak(transactions, today)
}

export function weekStrip(transactions: readonly Transaction[], today = utcDateKey(), goal = DAILY_GOAL): readonly WeekDay[] {
  const start = mondayOf(today)
  return WEEK_LABELS.map((label, index) => {
    const date = shiftUtcDate(start, index)
    const earned = earnedOn(transactions, date)
    if (date === today) return { date, label, mark: 'today' as const, earned }
    if (date > today) return { date, label, mark: 'upcoming' as const, earned }
    if (earned >= goal) return { date, label, mark: 'secured' as const, earned }
    if (earned >= GRACE_FLOOR) return { date, label, mark: 'grace' as const, earned }
    if (earned > 0) return { date, label, mark: 'missed' as const, earned }
    return { date, label, mark: 'quiet' as const, earned }
  })
}
