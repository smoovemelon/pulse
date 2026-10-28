import { useCallback, useEffect } from 'react'
import { localDateKey } from '../lib/dates'
import { createId } from '../lib/id'
import { buildHabitPayload, callGemini } from '../lib/gemini'
import {
  clampHabitTitle,
  clearDeckWarning,
  cooldownRemaining,
  decksAreValid,
  deckComplete,
  distributeHabitPoints,
  nextOpenHabit,
  proposePacing,
  syncLiveDiscipline,
} from '../services/engine'
import type { HabitDeck, PulseState, Relevance, StrainBand } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

function isStrain(value: unknown): value is StrainBand {
  return value === 'HIGH' || value === 'MEDIUM' || value === 'LOW'
}

function isRelevance(value: unknown): value is Relevance {
  return value === 'DIRECT' || value === 'ENABLING' || value === 'GENERAL'
}

export function useHabitsController() {
  const { state, read, commit, notify, feedback } = useCore()

  useEffect(() => {
    const tick = () => {
      const current = read()
      const next = syncLiveDiscipline(current)
      const sameDay = next.habitDay.date === current.habitDay.date && next.habitDay.completedIds.length === current.habitDay.completedIds.length && next.habitDay.clearedWarnings.join() === current.habitDay.clearedWarnings.join()
      const sameWarnings = next.warnings.join() === current.warnings.join()
      const sameJoin = next.joinedAt === current.joinedAt
      const samePacing = next.pacing.deck1Cutoff === current.pacing.deck1Cutoff && next.pacing.deck2Cutoff === current.pacing.deck2Cutoff && next.pacing.auditCutoff === current.pacing.auditCutoff && !next.pacing.pendingConfig === !current.pacing.pendingConfig
      if (!sameDay || !sameWarnings || !samePacing || !sameJoin) commit(next)
    }
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [commit, read])

  const completeHabit = useCallback(
    (habitId: string) => {
      const current = syncLiveDiscipline(read())
      const open = nextOpenHabit(current.decks, current.habitDay.completedIds)
      if (!open || open.habit.id !== habitId) {
        feedback('error')
        notify('Finish the habit ahead of this one first')
        return
      }
      const completedIds = [...current.habitDay.completedIds, habitId]
      const transactions = [
        {
          id: createId('tx'),
          type: 'EARN' as const,
          title: open.habit.title,
          points: open.habit.points,
          timestamp: new Date().toISOString(),
          date: localDateKey(),
          reasoning: 'Habit deck bounty',
          formula_breakdown: `${open.habit.points} PTS flat`,
        },
        ...current.transactions,
      ]
      let next: PulseState = {
        ...current,
        balance: current.balance + open.habit.points,
        transactions,
        habitDay: { ...current.habitDay, completedIds },
      }
      if (deckComplete(current.decks[open.deckIndex], completedIds)) next = clearDeckWarning(next, open.deckIndex)
      commit(next)
      feedback('earn')
      notify(`+${open.habit.points} PTS: "${open.habit.title}"`)
    },
    [commit, feedback, notify, read],
  )

  const usePto = useCallback(() => {
    const current = read()
    if (current.ptoTokens < 1) {
      feedback('error')
      notify('No PTO tokens left')
      return
    }
    commit({
      ...current,
      ptoTokens: current.ptoTokens - 1,
      warnings: [],
      habitDay: { ...current.habitDay, shielded: true, clearedWarnings: ['deck1', 'deck2', 'deck3'] },
    })
    feedback('click')
    notify('PTO shield is up for today')
  }, [commit, feedback, notify, read])

  const savePacing = useCallback(
    (deck1Cutoff: string, deck2Cutoff: string) => {
      const current = read()
      const result = proposePacing(current.pacing, deck1Cutoff, deck2Cutoff, current.warnings)
      if (!result.ok) {
        feedback('error')
        notify(result.message)
        return false
      }
      commit({ ...current, pacing: result.pacing })
      feedback('click')
      notify('Cutoffs take effect tomorrow')
      return true
    },
    [commit, feedback, notify, read],
  )

  const saveDecks = useCallback(
    async (decks: readonly HabitDeck[]) => {
      const current = read()
      if (current.habitDay.completedIds.length > 0 || current.warnings.length > 0) {
        feedback('error')
        notify('Finish today or use a PTO shield before editing decks')
        return null
      }
      const cleaned = decks.map((deck) => ({
        ...deck,
        name: deck.name.trim(),
        habits: deck.habits.map((habit) => ({ ...habit, title: clampHabitTitle(habit.title) })),
      }))
      const invalid = decksAreValid(cleaned)
      if (invalid) {
        feedback('error')
        notify(invalid)
        return null
      }
      const habits = cleaned.flatMap((deck) => deck.habits.map((habit) => ({ id: habit.id, title: habit.title })))
      let rated = cleaned
      let offline = true
      if (current.apiKey.trim()) {
        try {
          const { data } = await callGemini<{ habits?: { id?: string; strain?: StrainBand; relevance?: Relevance }[] }>(
            buildHabitPayload(current.disciplineAnchor, habits),
            current.apiKey,
          )
          const byId = new Map((data.habits ?? []).map((habit) => [habit.id, habit]))
          rated = cleaned.map((deck) => ({
            ...deck,
            habits: deck.habits.map((habit) => {
              const score = byId.get(habit.id)
              return {
                ...habit,
                strain: isStrain(score?.strain) ? score.strain : 'MEDIUM',
                relevance: isRelevance(score?.relevance) ? score.relevance : 'GENERAL',
              }
            }),
          }))
          offline = false
        } catch {
          offline = true
        }
      }
      const scored = distributeHabitPoints(rated)
      commit({
        ...read(),
        decks: scored,
        habitsNeedScore: offline,
      })
      feedback('click')
      notify(offline ? 'Each habit was judged on-device' : 'Each habit has a judged point value')
      return scored
    },
    [commit, feedback, notify, read],
  )

  return {
    decks: state.decks,
    habitDay: state.habitDay,
    warnings: state.warnings,
    ptoTokens: state.ptoTokens,
    pacing: state.pacing,
    cooldownMs: cooldownRemaining(state.pacing),
    habitsNeedScore: state.habitsNeedScore,
    chainStreak: state.chainStreak,
    completeHabit,
    usePto,
    savePacing,
    saveDecks,
  }
}

export function useHabits() {
  return useSlices().habits
}
