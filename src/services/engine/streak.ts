import { DAILY_GOAL, localDateKey } from '../../lib/dates'
import type { StreakState, Transaction, WeekDay } from '../../types'
import { forgeTarget, graceFloor } from './forge'
import { earnedOn } from './momentum'

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

export function isStreakState(value: unknown): value is StreakState {
  return value === 'STALLED' || value === 'SAFE' || value === 'SECURED'
}

export function streakTier(earned: number, goal = DAILY_GOAL): StreakState {
  if (earned >= goal) return 'SECURED'
  if (earned >= graceFloor(goal)) return 'SAFE'
  return 'STALLED'
}

export function advanceStreak(count: number, earned: number, goal = DAILY_GOAL) {
  const streakState = streakTier(earned, goal)
  const streakCount = streakState === 'SECURED' ? count + 1 : streakState === 'SAFE' ? count : 0
  return { streakCount, streakState }
}

export function streakMultiplier(_days: number): number {
  return 1
}

export function applyStreakBonus(points: number, _days: number): number {
  return points
}

export function streakStatusMessage(todayPts: number, goal = DAILY_GOAL, fee = 15): string {
  const grace = graceFloor(goal)
  if (todayPts >= goal) return `${goal} PTS output target hit.`
  if (todayPts >= grace) return `Grace floor held. Earn ${goal - todayPts} PTS to grow the output streak.`
  return `Earn ${grace - todayPts} PTS to prevent decay (-${fee} PTS).`
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

export function replayStreak(transactions: readonly Transaction[], today = localDateKey()) {
  const dates = transactions.map((tx) => tx.date).filter((date) => date && date < today).sort()
  if (dates.length === 0) return { streakCount: 0, streakState: 'STALLED' as const }
  let cursor = dates[0]
  let streakCount = 0
  let streakState: StreakState = 'STALLED'
  while (cursor < today) {
    const next = advanceStreak(streakCount, earnedOn(transactions, cursor), forgeTarget(transactions, cursor))
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
  today = localDateKey(),
) {
  if (count !== undefined && Number.isFinite(count) && count >= 0 && isStreakState(state)) {
    return { streakCount: Math.floor(count), streakState: state }
  }
  return replayStreak(transactions, today)
}

export function weekStrip(transactions: readonly Transaction[], today = localDateKey(), goal = forgeTarget(transactions, today)): readonly WeekDay[] {
  const start = mondayOf(today)
  return WEEK_LABELS.map((label, index) => {
    const date = shiftUtcDate(start, index)
    const earned = earnedOn(transactions, date)
    const dayGoal = date <= today ? forgeTarget(transactions, date) : goal
    if (date === today) return { date, label, mark: 'today' as const, earned }
    if (date > today) return { date, label, mark: 'upcoming' as const, earned }
    if (earned >= dayGoal) return { date, label, mark: 'secured' as const, earned }
    if (earned >= graceFloor(dayGoal)) return { date, label, mark: 'grace' as const, earned }
    if (earned > 0) return { date, label, mark: 'missed' as const, earned }
    return { date, label, mark: 'quiet' as const, earned }
  })
}
