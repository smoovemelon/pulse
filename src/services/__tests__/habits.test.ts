import { describe, expect, it } from 'vitest'
import { distributeHabitPoints, nextOpenHabit } from '../engine/habits'
import { freshState } from '../persistence'

describe('habit decks', () => {
  it('keeps deck 2 closed until deck 1 is complete', () => {
    const decks = freshState().decks
    expect(nextOpenHabit(decks, [])?.deckIndex).toBe(0)
    const firstOnly = [decks[0].habits[0].id]
    expect(nextOpenHabit(decks, firstOnly)?.deckIndex).toBe(0)
    const deckOne = decks[0].habits.map((habit) => habit.id)
    expect(nextOpenHabit(decks, deckOne)?.deckIndex).toBe(1)
    expect(nextOpenHabit(decks, [decks[1].habits[0].id])?.deckIndex).toBe(0)
  })

  it('spreads habit points across a 60 to 85 point pool', () => {
    const decks = distributeHabitPoints(freshState().decks)
    const total = decks.reduce((sum, deck) => sum + deck.habits.reduce((inner, habit) => inner + habit.points, 0), 0)
    expect(decks).toHaveLength(3)
    expect(decks.every((deck) => deck.habits.length >= 3 && deck.habits.length <= 5)).toBe(true)
    expect(total).toBe(85)
    expect(decks.every((deck) => deck.habits.every((habit) => habit.points >= 1))).toBe(true)
  })

  it('lets the weight multiplier raise a habit share', () => {
    const habit = (id: string, relevance: 'DIRECT' | 'GENERAL', weightClass: 'HEAVYWEIGHT' | 'LIGHTWEIGHT') => ({
      id,
      title: 'Block',
      points: 0,
      strain: 'MEDIUM' as const,
      relevance,
      weightClass,
    })
    const decks = distributeHabitPoints([
      {
        id: 'deck-1',
        name: 'Morning',
        habits: [
          habit('heavy', 'DIRECT', 'HEAVYWEIGHT'),
          habit('light', 'GENERAL', 'LIGHTWEIGHT'),
          habit('other', 'GENERAL', 'LIGHTWEIGHT'),
        ],
      },
      { id: 'deck-2', name: 'Midday', habits: [habit('a', 'GENERAL', 'LIGHTWEIGHT'), habit('b', 'GENERAL', 'LIGHTWEIGHT'), habit('c', 'GENERAL', 'LIGHTWEIGHT')] },
      { id: 'deck-3', name: 'Evening', habits: [habit('d', 'GENERAL', 'LIGHTWEIGHT'), habit('e', 'GENERAL', 'LIGHTWEIGHT'), habit('f', 'GENERAL', 'LIGHTWEIGHT')] },
    ])
    const [heavy, light] = decks[0].habits
    expect(heavy.points).toBeGreaterThan(light.points)
    expect(decks[0].habits.every((item) => !('minutes' in item))).toBe(true)
  })

  it('lands a full deck on the pool after rounding', () => {
    const habit = (id: string) => ({ id, title: 'Block', points: 0, strain: 'LOW' as const, relevance: 'GENERAL' as const })
    const deck = (id: string) => ({
      id,
      name: id,
      habits: [habit(`${id}-1`), habit(`${id}-2`), habit(`${id}-3`), habit(`${id}-4`), habit(`${id}-5`)],
    })
    const decks = distributeHabitPoints([deck('deck-1'), deck('deck-2'), deck('deck-3')])
    const total = decks.reduce((sum, item) => sum + item.habits.reduce((inner, entry) => inner + entry.points, 0), 0)
    expect(total).toBe(85)
    expect(decks.every((item) => item.habits.every((entry) => entry.points >= 1))).toBe(true)
  })
})
