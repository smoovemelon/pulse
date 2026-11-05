import { useCallback, useEffect } from 'react'
import { localDateKey } from '../lib/dates'
import { runDecayAudit } from '../services/audit'
import { deckComplete, decayPenalty, discountRate, earnedOn, forgeTarget, perkTier, streakStatusMessage, streakTier, syncLiveDiscipline, weekStrip } from '../services/engine'
import type { DecayAlert, StreakState, WeekDay } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface EconomyApi {
  readonly balance: number
  readonly dailyGoal: number
  readonly todayEarned: number
  readonly forgeStreak: number
  readonly chainStreak: number
  readonly tier: number
  readonly discountPercent: number
  readonly decksComplete: number
  readonly streakState: StreakState
  readonly streakStatus: string
  readonly week: readonly WeekDay[]
  readonly decayAlert: DecayAlert | null
  dismissDecay: () => void
}

export function useEconomyController(): EconomyApi {
  const { state, read, commit, notify, feedback, decayAlert, setDecayAlert } = useCore()

  const runAudit = useCallback(() => {
    const before = read()
    const result = runDecayAudit(before)
    const synced = syncLiveDiscipline(result.changed ? result.state : before)
    const changed = result.changed
      || synced.habitDay.date !== before.habitDay.date
      || synced.habitDay.completedIds.join() !== before.habitDay.completedIds.join()
      || synced.habitDay.clearedWarnings.join() !== before.habitDay.clearedWarnings.join()
      || synced.warnings.join() !== before.warnings.join()
      || synced.pacing.auditCutoff !== before.pacing.auditCutoff
      || synced.joinedAt !== before.joinedAt
    if (changed) commit(synced)
    if (result.alert) {
      setDecayAlert(result.alert)
      feedback('spend')
      notify(`Discipline Decay Applied: -${result.alert.penalty} PTS`)
    }
  }, [commit, feedback, notify, read, setDecayAlert])

  useEffect(() => {
    runAudit()
    const id = window.setInterval(runAudit, 30_000)
    return () => window.clearInterval(id)
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
    forgeStreak: state.forgeStreak,
    chainStreak: state.chainStreak,
    tier: perk.tier,
    discountPercent: Math.round(discountRate(state) * 100),
    decksComplete: state.decks.filter((deck) => deckComplete(deck, state.habitDay.completedIds)).length,
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
