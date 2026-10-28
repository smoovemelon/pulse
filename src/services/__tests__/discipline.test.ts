import { describe, expect, it } from 'vitest'
import { localDateKey } from '../../lib/dates'
import { distributeHabitPoints, nextOpenHabit } from '../engine/habits'
import { scoreJudgment } from '../engine/judging'
import { closedDayWarnings, cooldownRemaining, defaultPacing, proposePacing, settleDiscipline } from '../engine/pacing'
import { disciplineDefaults } from '../engine/pacing'
import { freshState } from '../persistence'

describe('deterministic judging', () => {
  it('multiplies strain, relevance, and weight in code', () => {
    const heavy = scoreJudgment({ relevance: 'DIRECT', strain: 'HIGH', weightClass: 'HEAVYWEIGHT', reasoning: 'Direct.' }, 'Ship it')
    const middle = scoreJudgment({ relevance: 'ENABLING', strain: 'MEDIUM', weightClass: 'CRUISERWEIGHT', reasoning: 'Setup.' }, 'Prep')
    const light = scoreJudgment({ relevance: 'GENERAL', strain: 'LOW', weightClass: 'LIGHTWEIGHT', reasoning: 'Aside.' }, 'Tidy')

    expect(heavy.points).toBe(120)
    expect(heavy.multiplier).toBe(2)
    expect(middle.points).toBe(45)
    expect(light.points).toBe(10)
    expect(scoreJudgment({ relevance: 'DIRECT', strain: 'LOW', weightClass: 'LIGHTWEIGHT', reasoning: 'Small.' }, 'Note').points).toBe(20)
  })
})

describe('habit decks', () => {
  it('spreads a 60 to 85 point pool across the three decks', () => {
    const decks = distributeHabitPoints(freshState().decks)
    const total = decks.reduce((sum, deck) => sum + deck.habits.reduce((inner, habit) => inner + habit.points, 0), 0)
    expect(decks).toHaveLength(3)
    expect(total).toBeGreaterThanOrEqual(60)
    expect(total).toBeLessThanOrEqual(85)
    expect(nextOpenHabit(decks, [])?.habit.id).toBe(decks[0].habits[0].id)
    expect(nextOpenHabit(decks, [decks[0].habits[0].id])?.habit.id).toBe(decks[0].habits[1].id)
    const firstDeck = decks[0].habits.map((habit) => habit.id)
    expect(nextOpenHabit(decks, firstDeck)?.deckIndex).toBe(1)
  })
})

describe('pacing locks', () => {
  it('queues cutoff edits for the next day and blocks a second edit', () => {
    const now = new Date('2026-10-28T15:00:00Z')
    const today = localDateKey(now)
    const pacing = defaultPacing(now)
    const saved = proposePacing(pacing, '14:00', '20:00', [], now, today)
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.pacing.deck1Cutoff).toBe('13:00')
    expect(saved.pacing.pendingConfig?.effectiveDate).not.toBe(today)
    expect(proposePacing(saved.pacing, '15:00', '21:00', [], now, today).ok).toBe(false)
    expect(proposePacing(pacing, '14:00', '20:00', ['deck1'], now, today).ok).toBe(false)
    expect(cooldownRemaining(saved.pacing, now)).toBeGreaterThan(0)
  })

  it('eliminates both streaks when three warnings survive the day', () => {
    const state = {
      ...freshState(),
      balance: 200,
      streakCount: 4,
      chainStreak: 3,
      habitDay: { ...freshState().habitDay, date: '2026-10-20' },
    }
    const warnings = closedDayWarnings(state.decks, [], [], 20, 120)
    expect(warnings).toEqual(['deck1', 'deck2', 'deck3'])
    const settled = settleDiscipline(state, '2026-10-20', 20)
    expect(settled.streakCount).toBe(0)
    expect(settled.chainStreak).toBe(0)
    expect(settled.transactions[0]).toMatchObject({ title: 'Elimination: Unfinished habits', is_locked: true })
    expect(settled.balance).toBeGreaterThanOrEqual(0)
  })

  it('banks a PTO token on the seventh clean day', () => {
    const state = {
      ...disciplineDefaults(new Date('2026-10-21T15:00:00Z')),
      ...freshState(),
      balance: 300,
      streakCount: 2,
      ptoCadence: 6,
      ptoTokens: 1,
      habitDay: {
        date: '2026-10-21',
        completedIds: freshState().decks.flatMap((deck) => deck.habits.map((habit) => habit.id)),
        clearedWarnings: [],
        shielded: false,
      },
    }
    const settled = settleDiscipline(state, '2026-10-21', 120)
    expect(settled.ptoTokens).toBe(2)
    expect(settled.ptoCadence).toBe(0)
    expect(settled.chainStreak).toBe(1)
  })
})
