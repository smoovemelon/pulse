import { DECAY_PENALTY, utcDateKey } from '../../lib/dates'
import type { Transaction } from '../../types'
import { earnedOn } from './momentum'

export interface DecayAssessment {
  readonly today: string
  readonly earned: number
  readonly missed: boolean
  readonly penalty: number
  readonly shouldApply: boolean
  readonly met: boolean
}

export function auditDecay(
  lastAuditDate: string,
  transactions: readonly Transaction[],
  dailyGoal: number,
  options?: { readonly today?: string; readonly force?: boolean; readonly enabled?: boolean },
): DecayAssessment {
  const today = options?.today ?? utcDateKey()
  const force = options?.force ?? false
  const enabled = options?.enabled ?? true
  const shouldApply = (enabled || force) && (lastAuditDate < today || force)

  if (!shouldApply) {
    return { today, earned: 0, missed: false, penalty: 0, shouldApply: false, met: false }
  }

  const checkDate = force ? today : lastAuditDate
  const earned = earnedOn(transactions, checkDate)
  const missed = earned < dailyGoal
  return {
    today,
    earned,
    missed,
    penalty: missed ? DECAY_PENALTY : 0,
    shouldApply: true,
    met: !missed,
  }
}
