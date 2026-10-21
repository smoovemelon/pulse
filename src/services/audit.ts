import { DECAY_PENALTY, utcDateKey } from '../lib/dates'
import type { DecayAlert, PulseState, SpendTransaction } from '../types'
import { advanceStreak, auditDecay } from './engine'

export interface AuditResult {
  readonly state: PulseState
  readonly changed: boolean
  readonly alert: DecayAlert | null
  readonly met: boolean
  readonly earned: number
}

export function runDecayAudit(state: PulseState, force = false): AuditResult {
  const today = utcDateKey()
  const last = localStorage.getItem('pulse_last_audit') || state.lastAuditDate
  const assessment = auditDecay(last, state.transactions, state.dailyGoal, {
    today,
    force,
  })

  if (!assessment.shouldApply) {
    return { state, changed: false, alert: null, met: false, earned: 0 }
  }

  localStorage.setItem('pulse_last_audit', assessment.today)

  const checkDate = force ? assessment.today : last
  const alreadyClosed = localStorage.getItem('pulse_streak_closed') === checkDate
  const nextStreak = alreadyClosed
    ? { streakCount: state.streakCount, streakState: state.streakState }
    : advanceStreak(state.streakCount, assessment.earned, state.dailyGoal)
  if (!alreadyClosed) localStorage.setItem('pulse_streak_closed', checkDate)

  const charge = !alreadyClosed && assessment.penalty > 0
  if (charge) {
    const penalty: SpendTransaction = {
      id: `tx-decay-${Date.now()}`,
      type: 'SPEND',
      title: 'Discipline Decay: Target Missed',
      points: assessment.penalty || DECAY_PENALTY,
      category: 'Decay Audit',
      reasoning: `The day closed under 60 PTS. Streak reset and accountability fee assessed.`,
      timestamp: 'Today, Midnight Audit',
      date: assessment.today,
    }
    return {
      state: {
        ...state,
        ...nextStreak,
        balance: Math.max(0, state.balance - (assessment.penalty || DECAY_PENALTY)),
        lastAuditDate: assessment.today,
        transactions: [penalty, ...state.transactions],
      },
      changed: true,
      alert: { earned: assessment.earned },
      met: false,
      earned: assessment.earned,
    }
  }

  return {
    state: { ...state, ...nextStreak, lastAuditDate: assessment.today },
    changed: true,
    alert: null,
    met: assessment.met,
    earned: assessment.earned,
  }
}
