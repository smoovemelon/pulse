import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANCHOR } from '../../lib/dates'
import type { PulseState, Transaction } from '../../types'
import { runDecayAudit } from '../audit'
import { calculateActionPoints, currentStreak, validateVaultDraft } from '../economy'

const JUDGED = ['Session', 'Session', 'Logged work'] as const

function score(strain: number, alignment: number, minutes: number) {
  return calculateActionPoints(strain, alignment, minutes, ...JUDGED)
}

function earn(date: string, points: number): Transaction {
  return {
    id: `earn-${date}-${points}`,
    type: 'EARN',
    title: 'Session',
    points,
    timestamp: 'Yesterday',
    date,
  }
}

function ledger(partial: Partial<PulseState> = {}): PulseState {
  return {
    balance: 200,
    soundEnabled: true,
    decayEnabled: true,
    lastAuditDate: '2026-10-20',
    apiKey: '',
    disciplineAnchor: DEFAULT_ANCHOR,
    dailyGoal: 120,
    theme: 'light',
    transactions: [],
    vaultItems: [],
    ...partial,
  }
}

describe('action evaluation', () => {
  it('scales a middleweight session from 15m through 45m to 90m', () => {
    const short = score(8, 2, 15)
    const baseline = score(8, 2, 45)
    const long = score(8, 2, 90)

    expect(short).toMatchObject({ duration: 15, basePoints: 39, multiplier: 1, points: 39, weightClass: 'Middleweight (1.0x)' })
    expect(baseline).toMatchObject({ duration: 45, basePoints: 64, multiplier: 1, points: 64 })
    expect(long).toMatchObject({ duration: 90, basePoints: 87, multiplier: 1, points: 87 })
    expect(short.points).toBeLessThan(baseline.points)
    expect(baseline.points).toBeLessThan(long.points)
    expect(baseline.breakdown).toBe('Base: 64 (Strain 8.0 @ 45m) × 1x (Middleweight)')
  })

  it('applies heavyweight, cruiserweight, and middleweight multipliers at a 45m baseline', () => {
    const heavy = score(10, 8, 45)
    const cruiser = score(10, 4, 45)
    const middle = score(10, 3.99, 45)

    expect(heavy).toMatchObject({ basePoints: 80, multiplier: 2, points: 160, weightClass: 'Heavyweight (2.0x)' })
    expect(cruiser).toMatchObject({ basePoints: 80, multiplier: 1.5, points: 120, weightClass: 'Cruiserweight (1.5x)' })
    expect(middle).toMatchObject({ basePoints: 80, multiplier: 1, points: 80, weightClass: 'Middleweight (1.0x)' })
    expect(score(10, 7.99, 45).multiplier).toBe(1.5)
    expect(score(10, 10, 45).points).toBe(160)
  })
})

describe('midnight decay', () => {
  beforeEach(() => {
    const bag = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => {
        bag.set(key, value)
      },
      removeItem: (key: string) => {
        bag.delete(key)
      },
      clear: () => {
        bag.clear()
      },
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-21T15:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('charges 15 PTS when the missed day earned under 120', () => {
    const result = runDecayAudit(
      ledger({
        balance: 200,
        transactions: [earn('2026-10-20', 119)],
      }),
    )

    expect(result.met).toBe(false)
    expect(result.alert).toEqual({ earned: 119 })
    expect(result.earned).toBe(119)
    expect(result.state.balance).toBe(185)
    expect(result.state.lastAuditDate).toBe('2026-10-21')
    expect(result.state.transactions[0]).toMatchObject({
      type: 'SPEND',
      title: 'Discipline Decay: Target Missed',
      points: 15,
      category: 'Decay Audit',
      date: '2026-10-21',
    })
    expect(localStorage.getItem('pulse_last_audit')).toBe('2026-10-21')
  })

  it('leaves the balance unchanged when momentum reaches 120', () => {
    const result = runDecayAudit(
      ledger({
        transactions: [earn('2026-10-20', 80), earn('2026-10-20', 40)],
      }),
    )

    expect(result.met).toBe(true)
    expect(result.alert).toBeNull()
    expect(result.earned).toBe(120)
    expect(result.state.balance).toBe(200)
    expect(result.state.transactions.every((tx) => tx.category !== 'Decay Audit')).toBe(true)
  })

  it('does not drive the balance below zero', () => {
    const result = runDecayAudit(ledger({ balance: 10, transactions: [] }))
    expect(result.state.balance).toBe(0)
    expect(result.state.transactions[0]?.points).toBe(15)
  })
})

describe('vault category validation', () => {
  it('blocks gaming that carries a dollar price', () => {
    expect(validateVaultDraft('Gaming', 12, 1)).toEqual({
      ok: false,
      message: 'Gaming is time-only. Price must stay at $0.',
    })
  })

  it('blocks dining and events with no duration', () => {
    expect(validateVaultDraft('Dining', 35, 0)).toEqual({
      ok: false,
      message: 'Please specify a duration (hours) for Dining',
    })
    expect(validateVaultDraft('Events', 0, 0).ok).toBe(false)
  })

  it('blocks items that include hours or omit a price', () => {
    expect(validateVaultDraft('Items', 40, 2).ok).toBe(false)
    expect(validateVaultDraft('Items', 0, 0)).toEqual({
      ok: false,
      message: 'Please specify a price (USD $) for Items',
    })
  })

  it('accepts a timed gaming session, a priced item, and a free dining block', () => {
    expect(validateVaultDraft('Gaming', 0, 1.5)).toEqual({ ok: true })
    expect(validateVaultDraft('Items', 80, 0)).toEqual({ ok: true })
    expect(validateVaultDraft('Dining', 0, 2)).toEqual({ ok: true })
    expect(validateVaultDraft('Events', 15, 3)).toEqual({ ok: true })
  })
})

describe('current streak', () => {
  const row = (date: string, points: number): Transaction => ({
    id: `${date}-${points}`,
    type: 'EARN',
    title: 'Session',
    points,
    timestamp: date,
    date,
  })

  it('counts consecutive days at or above 120 and defaults to 1 when today has activity', () => {
    const today = '2026-10-21'
    expect(currentStreak([row(today, 120), row('2026-10-20', 130), row('2026-10-19', 40)], today)).toBe(2)
    expect(currentStreak([row(today, 30)], today)).toBe(1)
    expect(currentStreak([row('2026-10-20', 120), row('2026-10-19', 120)], today)).toBe(2)
    expect(currentStreak([row('2026-10-20', 40)], today)).toBe(0)
  })
})
