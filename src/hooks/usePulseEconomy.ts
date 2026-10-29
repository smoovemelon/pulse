import { useCallback, useEffect } from 'react'
import { localDateKey } from '../lib/dates'
import { runDecayAudit } from '../services/audit'
import { deckComplete, decayPenalty, discountRate, earnedOn, forgeTarget, perkTier, streakStatusMessage, streakTier, weekStrip } from '../services/engine'
import type { DecayAlert, StreakState, WeekDay } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface EconomyApi {
  readonly balance: number
  readonly dailyGoal: number
  readonly todayEarned: number
  readonly momentumPct: number
  readonly streak: number
  readonly forgeStreak: number
  readonly chainStreak: number
  readonly tier: number
  readonly discountPercent: number
  readonly decksComplete: number
  readonly graceFloor: number
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
      notify(`Discipline Decay Applied: -${result.alert.penalty} PTS`)
    }
  }, [commit, feedback, notify, read, setDecayAlert])

  useEffect(() => {
    runAudit()
  }, [runAudit])

  const today = localDateKey()
  const todayEarned = earnedOn(state.transactions, today)
  const target = forgeTarget(state.transactions, today)
  const perk = perkTier(state.chainStreak, state.forgeStreak)
  const fee = decayPenalty(state.chainStreak, state.forgeStreak)

  return {
    balance: state.balance,
    dailyGoal: target,
    todayEarned,
    momentumPct: Math.min(100, Math.round((todayEarned / target) * 100)),
    streak: state.forgeStreak,
    forgeStreak: state.forgeStreak,
    chainStreak: state.chainStreak,
    tier: perk.tier,
    discountPercent: Math.round(discountRate(state) * 100),
    decksComplete: state.decks.filter((deck) => deckComplete(deck, state.habitDay.completedIds)).length,
    graceFloor: target * 0.5,
    streakMultiplier: 1,
    streakState: streakTier(todayEarned, target),
    streakStatus: streakStatusMessage(todayEarned, target, fee),
    week: weekStrip(state.transactions, today, target),
    decayAlert,
    dismissDecay: () => setDecayAlert(null),
  }
}

export function usePulseEconomy() {
  return useSlices().economy
}
