import { DECAY_PENALTY, utcDateKey } from '../lib/dates'
import type { DecayAlert, PulseState } from '../types'
import { earnedOn } from './economy'

export interface AuditResult {
  state: PulseState
  changed: boolean
  alert: DecayAlert | null
  met: boolean
  earned: number
}

export function runDecayAudit(state: PulseState, force = false): AuditResult {
  const today = utcDateKey()
  const last = localStorage.getItem('pulse_last_audit') || state.lastAuditDate

  if (!state.decayEnabled && !force) {
    return { state, changed: false, alert: null, met: false, earned: 0 }
  }
  if (!(last < today || force)) {
    return { state, changed: false, alert: null, met: false, earned: 0 }
  }

  const checkDate = force ? today : last
  const earned = earnedOn(state.transactions, checkDate)
  localStorage.setItem('pulse_last_audit', today)

  if (earned < state.dailyGoal) {
    return {
      state: {
        ...state,
        balance: Math.max(0, state.balance - DECAY_PENALTY),
        lastAuditDate: today,
        transactions: [
          {
            id: `tx-decay-${Date.now()}`,
            type: 'SPEND',
            title: 'Discipline Decay: Target Missed',
            points: DECAY_PENALTY,
            category: 'Decay Audit',
            reasoning: `Momentum fell short of ${state.dailyGoal} PTS target. Accountability fee assessed.`,
            timestamp: 'Today, Midnight Audit',
            date: today,
          },
          ...state.transactions,
        ],
      },
      changed: true,
      alert: { earned },
      met: false,
      earned,
    }
  }

  return {
    state: { ...state, lastAuditDate: today },
    changed: true,
    alert: null,
    met: true,
    earned,
  }
}
