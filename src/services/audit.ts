import { DECAY_PENALTY, utcDateKey } from '../lib/dates'
import type { DecayAlert, PulseState, SpendTransaction } from '../types'
import { auditDecay } from './engine'

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
    enabled: state.decayEnabled,
  })

  if (!assessment.shouldApply) {
    return { state, changed: false, alert: null, met: false, earned: 0 }
  }

  localStorage.setItem('pulse_last_audit', assessment.today)

  if (assessment.missed) {
    const penalty: SpendTransaction = {
      id: `tx-decay-${Date.now()}`,
      type: 'SPEND',
      title: 'Discipline Decay: Target Missed',
      points: assessment.penalty || DECAY_PENALTY,
      category: 'Decay Audit',
      reasoning: `Momentum fell short of ${state.dailyGoal} PTS target. Accountability fee assessed.`,
      timestamp: 'Today, Midnight Audit',
      date: assessment.today,
    }
    return {
      state: {
        ...state,
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
    state: { ...state, lastAuditDate: assessment.today },
    changed: true,
    alert: null,
    met: true,
    earned: assessment.earned,
  }
}
