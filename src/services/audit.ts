import { DECAY_PENALTY, GRACE_FLOOR, localDateKey, localNoonIso, shiftDateKey } from '../lib/dates'
import { createId } from '../lib/id'
import type { DecayAlert, PulseState, SpendTransaction } from '../types'
import { advanceStreak, earnedOn, settleDiscipline } from './engine'

export interface AuditResult {
  readonly state: PulseState
  readonly changed: boolean
  readonly alert: DecayAlert | null
  readonly met: boolean
  readonly earned: number
}

function datesUntil(start: string, endExclusive: string): string[] {
  const days: string[] = []
  let cursor = start
  while (cursor < endExclusive) {
    days.push(cursor)
    cursor = shiftDateKey(cursor, 1)
  }
  return days
}

function closeDay(state: PulseState, day: string): { state: PulseState; alert: DecayAlert | null; met: boolean; earned: number } {
  const earned = earnedOn(state.transactions, day)
  const shielded = state.habitDay.date === day && state.habitDay.shielded
  const nextStreak = shielded
    ? { streakCount: state.streakCount, streakState: state.streakState }
    : advanceStreak(state.streakCount, earned, state.dailyGoal)
  if (shielded || earned >= GRACE_FLOOR) {
    const next = state.habitDay.date === day ? settleDiscipline({ ...state, ...nextStreak }, day, earned) : { ...state, ...nextStreak }
    return {
      state: next,
      alert: null,
      met: next.streakState === 'SECURED',
      earned,
    }
  }

  const collected = Math.min(DECAY_PENALTY, Math.max(0, state.balance))
  const uncollected = DECAY_PENALTY - collected
  const reasoning = uncollected > 0
    ? `The day closed under 60 PTS. Streak reset. Collected ${collected} PTS of the 15 PTS fee. Uncollected ${uncollected} PTS because the balance reached 0.`
    : 'The day closed under 60 PTS. Streak reset and accountability fee assessed.'
  const penalty: SpendTransaction = {
    id: createId('tx'),
    type: 'SPEND',
    title: 'Discipline Decay: Target Missed',
    points: DECAY_PENALTY,
    category: 'Decay Audit',
    is_locked: true,
    reasoning,
    timestamp: localNoonIso(day),
    date: day,
  }
  const penalized = {
    ...state,
    ...nextStreak,
    balance: state.balance - collected,
    transactions: [penalty, ...state.transactions],
  }
  return {
    state: state.habitDay.date === day ? settleDiscipline(penalized, day, earned) : penalized,
    alert: { earned },
    met: false,
    earned,
  }
}

export function runDecayAudit(state: PulseState, force = false): AuditResult {
  const today = localDateKey()
  const last = localStorage.getItem('pulse_last_audit') || state.lastAuditDate

  if (force) {
    if (localStorage.getItem('pulse_streak_closed') === today) {
      return { state, changed: false, alert: null, met: false, earned: 0 }
    }
    const closed = closeDay(state, today)
    localStorage.setItem('pulse_last_audit', today)
    localStorage.setItem('pulse_streak_closed', today)
    return {
      state: { ...closed.state, lastAuditDate: today },
      changed: true,
      alert: closed.alert,
      met: closed.met,
      earned: closed.earned,
    }
  }

  if (last >= today) {
    return { state, changed: false, alert: null, met: false, earned: 0 }
  }

  const days = datesUntil(last, today)
  let cursor = state
  let alert: DecayAlert | null = null
  let met = false
  let earned = 0
  for (const day of days) {
    const closed = closeDay(cursor, day)
    cursor = closed.state
    met = closed.met
    earned = closed.earned
    if (closed.alert) alert = closed.alert
  }

  const closedThrough = days[days.length - 1] ?? shiftDateKey(today, -1)
  localStorage.setItem('pulse_last_audit', today)
  localStorage.setItem('pulse_streak_closed', closedThrough)
  return {
    state: { ...cursor, lastAuditDate: today },
    changed: true,
    alert,
    met,
    earned,
  }
}
