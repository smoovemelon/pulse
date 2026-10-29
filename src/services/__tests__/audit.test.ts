import { describe, expect, it, vi } from 'vitest'
import { runDecayAudit } from '../audit'
import { forgeTarget, graceFloor } from '../engine/forge'
import { advanceStreak } from '../engine/streak'
import { settleDiscipline } from '../engine/pacing'
import { freshState } from '../persistence'

function earn(date: string, points: number) {
  return { id: date, type: 'EARN' as const, title: 'Session', points, timestamp: date, date, reasoning: 'Judged' }
}

describe('output target and grace', () => {
  it('clamps the rolling median between 80 and 180', () => {
    expect(forgeTarget([], '2026-10-28')).toBe(120)
    expect(forgeTarget([earn('2026-10-20', 10)], '2026-10-21')).toBe(80)
    expect(forgeTarget([earn('2026-10-20', 500)], '2026-10-21')).toBe(180)
    expect(forgeTarget([earn('2026-10-20', 200), earn('2026-10-21', 40)], '2026-10-22')).toBe(120)
    expect(graceFloor(120)).toBe(60)
    expect(graceFloor(80)).toBe(40)
  })

  it('grows at the target, holds inside grace, and resets under it', () => {
    expect(advanceStreak(4, 120, 120)).toEqual({ streakCount: 5, streakState: 'SECURED' })
    expect(advanceStreak(4, 60, 120)).toEqual({ streakCount: 4, streakState: 'SAFE' })
    expect(advanceStreak(4, 59, 120)).toEqual({ streakCount: 0, streakState: 'STALLED' })
  })

  it('collects a decay fee only up to the current balance', () => {
    const bag = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => { bag.set(key, value) },
      removeItem: (key: string) => { bag.delete(key) },
      clear: () => bag.clear(),
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-21T15:00:00'))
    const result = runDecayAudit({
      ...freshState(),
      balance: 5,
      lastAuditDate: '2026-10-20',
      habitDay: {
        date: '2026-10-20',
        completedIds: freshState().decks.flatMap((deck) => deck.habits.map((habit) => habit.id)),
        clearedWarnings: [],
        shielded: false,
      },
      transactions: [earn('2026-10-20', 10)],
    })
    expect(result.state.balance).toBe(0)
    expect(result.state.transactions[0]?.points).toBe(15)
    expect(result.state.transactions[0]?.reasoning).toContain('Uncollected')
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('resets both streaks when three warnings survive the day', () => {
    const state = {
      ...freshState(),
      balance: 200,
      chainStreak: 3,
      forgeStreak: 4,
      streakCount: 4,
      habitDay: { ...freshState().habitDay, date: '2026-10-20' },
    }
    const settled = settleDiscipline(state, '2026-10-20', 20)
    expect(settled.chainStreak).toBe(0)
    expect(settled.forgeStreak).toBe(0)
    expect(settled.transactions[0]?.title).toBe('Elimination: Unfinished habits')
    expect(settled.balance).toBeGreaterThanOrEqual(0)
  })
})
