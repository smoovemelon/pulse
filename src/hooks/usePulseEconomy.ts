import { useCallback, useEffect } from 'react'
import { utcDateKey } from '../lib/dates'
import { runDecayAudit } from '../services/audit'
import { currentStreak, earnedOn, lifetimeStats } from '../services/engine'
import type { DecayAlert } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface EconomyApi {
  readonly balance: number
  readonly dailyGoal: number
  readonly todayEarned: number
  readonly momentumPct: number
  readonly streak: number
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
        notify('Discipline Decay Applied: -15 PTS (Short of Daily Goal)')
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

  const todayEarned = earnedOn(state.transactions, utcDateKey())
  const totals = lifetimeStats(state.transactions)

  return {
    balance: state.balance,
    dailyGoal: state.dailyGoal,
    todayEarned,
    momentumPct: Math.min(100, Math.round((todayEarned / state.dailyGoal) * 100)),
    streak: currentStreak(state.transactions, utcDateKey(), state.dailyGoal),
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
