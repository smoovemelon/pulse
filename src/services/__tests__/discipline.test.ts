import { describe, expect, it, vi } from 'vitest'
import { localDateKey } from '../../lib/dates'
import { runDecayAudit } from '../audit'
import { forgeTarget } from '../engine/forge'
import { progressWindow } from '../engine/progress'
import { applyDifficulty, migrateLegacyVault } from '../engine/vaultValuation'
import { distributeHabitPoints, nextOpenHabit } from '../engine/habits'
import { scoreJudgment } from '../engine/judging'
import { closedDayWarnings, cooldownRemaining, defaultPacing, proposePacing, settleDiscipline, syncLiveDiscipline } from '../engine/pacing'
import { emptyHabitDay } from '../engine/habits'
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

  it('skips cutoffs that already passed on the day a profile starts', () => {
    const day = '2026-10-28'
    const afternoon = new Date(2026, 9, 28, 14, 30)
    const evening = new Date(2026, 9, 28, 20, 15)
    const late = new Date(2026, 9, 28, 23, 10)
    const started = {
      ...freshState(),
      joinedAt: afternoon.toISOString(),
      habitDay: emptyHabitDay(day),
      warnings: ['deck1' as const],
    }

    const midday = syncLiveDiscipline(started, afternoon)
    expect(midday.warnings).toEqual([])
    expect(midday.habitDay.clearedWarnings).toEqual(['deck1'])

    const afterSecond = syncLiveDiscipline(started, evening)
    expect(afterSecond.warnings).toEqual(['deck2'])
    expect(afterSecond.habitDay.clearedWarnings).toEqual(['deck1'])

    const morning = syncLiveDiscipline({ ...started, joinedAt: new Date(2026, 9, 28, 9, 0).toISOString() }, afternoon)
    expect(morning.warnings).toEqual(['deck1'])

    const night = syncLiveDiscipline({ ...started, joinedAt: late.toISOString() }, late)
    expect(night.warnings).toEqual([])
    expect(night.habitDay.clearedWarnings).toEqual(['deck1', 'deck2', 'deck3'])
    expect(closedDayWarnings(night.decks, [], night.habitDay.clearedWarnings, 0, 120)).toEqual([])

    const nextDay = syncLiveDiscipline(
      { ...started, lastAuditDate: '2026-10-29', habitDay: emptyHabitDay('2026-10-29'), warnings: [] },
      new Date(2026, 9, 29, 15, 0),
    )
    expect(nextDay.warnings).toContain('deck1')
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

  it('sets the forge target from the median of the last active judged days', () => {
    const row = (date: string, points: number) => ({
      id: date,
      type: 'EARN' as const,
      title: 'Session',
      points,
      timestamp: date,
      date,
    })
    expect(forgeTarget([], '2026-10-28')).toBe(120)
    expect(forgeTarget([row('2026-10-20', 10)], '2026-10-21')).toBe(80)
    expect(forgeTarget([row('2026-10-20', 200), row('2026-10-21', 40)], '2026-10-22')).toBe(120)
    const habit = { ...row('2026-10-20', 500), reasoning: 'Habit deck bounty' }
    expect(forgeTarget([habit], '2026-10-21')).toBe(120)
  })

  it('maps legacy bounties onto time and money', () => {
    const gaming = migrateLegacyVault('Gaming', 120, 'g', 'Queue')
    const gear = migrateLegacyVault('Items', 100, 'i', 'Mug')
    expect(gaming).toMatchObject({ category: 'gaming', measurementType: 'time', durationMinutes: 60, baseCost: 120 })
    expect(gear).toMatchObject({ category: 'items', measurementType: 'money', priceDollars: 5, baseCost: 100 })
  })

  it('charges 20 points when tier 2 misses the grace floor', () => {
    const bag = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => { bag.set(key, value) },
      removeItem: (key: string) => { bag.delete(key) },
      clear: () => bag.clear(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-21T15:00:00Z'))
    const result = runDecayAudit({
      ...freshState(),
      balance: 100,
      lastAuditDate: '2026-10-20',
      chainStreak: 14,
      forgeStreak: 14,
      streakCount: 14,
      habitDay: { ...freshState().habitDay, date: '2026-10-21' },
      transactions: [{ id: 'low', type: 'EARN', title: 'Short', points: 10, timestamp: 't', date: '2026-10-20' }],
    })
    expect(result.state.transactions[0]?.points).toBe(20)
    expect(result.state.forgeStreak).toBe(0)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('allows one dial change, then keeps that choice', () => {
    const first = applyDifficulty(freshState(), 'hardcore')
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.state.difficultyLocked).toBe(true)
    expect(first.state.economy.difficulty).toBe('hardcore')
    expect(applyDifficulty(first.state, 'lenient').ok).toBe(false)
    expect(applyDifficulty(first.state, 'hardcore').ok).toBe(true)
  })
})

describe('progress window', () => {
  it('reads earned, spent, and the forge target for each day', () => {
    const row = (date: string, points: number, type: 'EARN' | 'SPEND' = 'EARN') => ({
      id: `${type}-${date}`,
      type,
      title: 'Row',
      points,
      timestamp: date,
      date,
      reasoning: 'Judged',
    })
    const days = progressWindow(
      [row('2026-10-27', 90), row('2026-10-27', 15, 'SPEND'), row('2026-10-28', 40)],
      2,
      '2026-10-28',
    )
    expect(days.map((day) => day.date)).toEqual(['2026-10-27', '2026-10-28'])
    expect(days[0]).toMatchObject({ earned: 90, spent: 15, goal: 120, onTarget: false })
    expect(days[1]).toMatchObject({ earned: 40, goal: 90, onTarget: false })
  })
})
