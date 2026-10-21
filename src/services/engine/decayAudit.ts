import { DECAY_PENALTY, GRACE_FLOOR, utcDateKey } from '../../lib/dates'
import type { StreakState, Transaction } from '../../types'
import { earnedOn } from './momentum'
import { streakTier } from './streak'

export interface DecayAssessment {
  readonly today: string
  readonly earned: number
  readonly missed: boolean
  readonly penalty: number
  readonly shouldApply: boolean
  readonly met: boolean
  readonly tier: StreakState
}

export function auditDecay(
  lastAuditDate: string,
  transactions: readonly Transaction[],
  dailyGoal: number,
  options?: { readonly today?: string; readonly force?: boolean },
): DecayAssessment {
  const today = options?.today ?? utcDateKey()
  const force = options?.force ?? false
  const shouldApply = lastAuditDate < today || force

  if (!shouldApply) {
    return { today, earned: 0, missed: false, penalty: 0, shouldApply: false, met: false, tier: 'STALLED' }
  }

  const checkDate = force ? today : lastAuditDate
  const earned = earnedOn(transactions, checkDate)
  const tier = streakTier(earned, dailyGoal)
  const missed = earned < GRACE_FLOOR
  return {
    today,
    earned,
    missed,
    penalty: missed ? DECAY_PENALTY : 0,
    shouldApply: true,
    met: tier === 'SECURED',
    tier,
  }
}
