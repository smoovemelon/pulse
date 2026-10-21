import { useCallback, useEffect } from 'react'
import { utcDateKey } from '../lib/dates'
import { runDecayAudit } from '../services/audit'
import { earnedOn, lifetimeStats, streakMultiplier, streakStatusMessage, streakTier, weekStrip } from '../services/engine'
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
  readonly lifetimeEarned: number
  readonly lifetimeSpent: number
  readonly decayEnabled: boolean
  readonly decayAlert: DecayAlert | null
  toggleDecay: () => void
  dismissDecay: () => void
  runAudit: (force?: boolean) => void
}

export function useEconomyController(): EconomyApi {
  const { state, read, commit, notify, feedback, decayAlert, setDecayAlert } = useCore()

  const runAudit = useCallback(
    (force = false) => {
      const result = runDecayAudit(read(), force)
      if (result.changed) commit(result.state)
      if (result.alert) {
        setDecayAlert(result.alert)
        feedback('spend')
        notify('Discipline Decay Applied: -15 PTS (Day closed under 60)')
      } else if (force && result.met) {
        notify(`Daily goal achieved (${result.earned}/${result.state.dailyGoal} PTS). No decay assessed!`)
      }
    },
    [commit, feedback, notify, read, setDecayAlert],
  )

  useEffect(() => {
    runAudit(false)
  }, [runAudit])

  const toggleDecay = useCallback(() => {
    const current = read()
    const next = commit({ ...current, decayEnabled: !current.decayEnabled })
    feedback('click')
    notify(next.decayEnabled ? 'Discipline decay enabled' : 'Discipline decay disabled')
  }, [commit, feedback, notify, read])

  const today = utcDateKey()
  const todayEarned = earnedOn(state.transactions, today)
  const totals = lifetimeStats(state.transactions)
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
    lifetimeEarned: totals.earned,
    lifetimeSpent: totals.spent,
    decayEnabled: state.decayEnabled,
    decayAlert,
    toggleDecay,
    dismissDecay: () => setDecayAlert(null),
    runAudit,
  }
}

export function usePulseEconomy() {
  return useSlices().economy
}
