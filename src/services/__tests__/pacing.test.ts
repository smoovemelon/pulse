import { describe, expect, it } from 'vitest'
import { localDateKey } from '../../lib/dates'
import { defaultDecks } from '../engine/habits'
import { cooldownRemaining, defaultPacing, dueWarnings, proposePacing, shaveWarning } from '../engine/pacing'
import { freshState } from '../persistence'

describe('pacing warnings', () => {
  it('opens deck warnings only after their cutoffs', () => {
    const decks = defaultDecks()
    const pacing = defaultPacing(new Date(2026, 9, 28, 14, 0))
    const afternoon = dueWarnings(decks, [], [], pacing, 0, 120, new Date(2026, 9, 28, 14, 0))
    const evening = dueWarnings(decks, [], [], pacing, 0, 120, new Date(2026, 9, 28, 20, 0))
    expect(afternoon).toEqual(['deck1'])
    expect(evening).toEqual(['deck1', 'deck2'])
  })

  it('clears one warning for a heavyweight log', () => {
    const state = { ...freshState(), warnings: ['deck1', 'deck2'] as const }
    const next = shaveWarning(state)
    expect(next.warnings).toEqual(['deck2'])
    expect(next.habitDay.clearedWarnings).toContain('deck1')
  })

  it('locks cutoff edits for 48 hours', () => {
    const now = new Date('2026-10-28T15:00:00Z')
    const today = localDateKey(now)
    const pacing = defaultPacing(now)
    const saved = proposePacing(pacing, '14:00', '20:00', [], now, today)
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    expect(saved.pacing.deck1Cutoff).toBe('13:00')
    expect(saved.pacing.pendingConfig?.effectiveDate).not.toBe(today)
    expect(proposePacing(saved.pacing, '15:00', '21:00', [], now, today).ok).toBe(false)
    expect(cooldownRemaining(saved.pacing, now)).toBeGreaterThan(0)
  })
})
