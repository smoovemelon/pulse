import { useCallback, useEffect } from 'react'
import { localDateKey } from '../lib/dates'
import { runDecayAudit } from '../services/audit'
import { earnedOn, streakMultiplier, streakStatusMessage, streakTier, weekStrip } from '../services/engine'
import type { DecayAlert, StreakState, WeekDay } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface EconomyApi {
  readonly balance: number
  readonly dailyGoal: number
  readonly todayEarned: number
  readonly momentumPct: number
  readonly streak: number
  readonly streakMultiplier: number
  readonly streakState: StreakState
  readonly streakStatus: string
  readonly week: readonly WeekDay[]
  readonly decayAlert: DecayAlert | null
  dismissDecay: () => void
}

export function useEconomyController(): EconomyApi {
  const { state, read, commit, notify, feedback, decayAlert, setDecayAlert } = useCore()

  const runAudit = useCallback(() => {
    const result = runDecayAudit(read())
    if (result.changed) commit(result.state)
    if (result.alert) {
      setDecayAlert(result.alert)
      feedback('spend')
      notify('Discipline Decay Applied: -15 PTS (Day closed under 60)')
    }
  }, [commit, feedback, notify, read, setDecayAlert])

  useEffect(() => {
    runAudit()
  }, [runAudit])

  const today = localDateKey()
  const todayEarned = earnedOn(state.transactions, today)
  const multiplier = streakMultiplier(state.streakCount)

  return {
    balance: state.balance,
    dailyGoal: state.dailyGoal,
    todayEarned,
    momentumPct: Math.min(100, Math.round((todayEarned / state.dailyGoal) * 100)),
    streak: state.streakCount,
    streakMultiplier: multiplier,
    streakState: streakTier(todayEarned, state.dailyGoal),
    streakStatus: streakStatusMessage(todayEarned, multiplier, state.dailyGoal),
    week: weekStrip(state.transactions, today, state.dailyGoal),
    decayAlert,
    dismissDecay: () => setDecayAlert(null),
  }
}

export function usePulseEconomy() {
  return useSlices().economy
}
