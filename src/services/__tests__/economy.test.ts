import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANCHOR, utcDateKey } from '../../lib/dates'
import type { PulseState, Transaction } from '../../types'
import { runDecayAudit } from '../audit'
import { DEMO_ACTION, DEMO_ANCHOR, DEMO_BOUNTY, DEMO_SPEND, enterDemo, exitDemo } from '../demo'
import { balanceAfterRemoval, calculateActionPoints, currentStreak, earnedOn, lifetimeStats, validateVaultDraft } from '../economy'
import { freshState, readDemoSnapshot } from '../persistence'

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
    demoMode: false,
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

describe('history removal', () => {
  const spend = (points: number): Transaction => ({
    id: `spend-${points}`,
    type: 'SPEND',
    title: 'Purchase',
    points,
    timestamp: 'Today',
    date: '2026-10-21',
    category: 'Gaming',
  })

  it('removes earned points from the balance, momentum, streak, and lifetime totals', () => {
    const today = '2026-10-21'
    const session = earn(today, 120)
    const kept = earn('2026-10-20', 120)
    const history = [session, kept]
    const remaining = history.filter((tx) => tx.id !== session.id)

    expect(balanceAfterRemoval(200, session)).toBe(80)
    expect(earnedOn(history, today)).toBe(120)
    expect(earnedOn(remaining, today)).toBe(0)
    expect(currentStreak(history, today)).toBe(2)
    expect(currentStreak(remaining, today)).toBe(1)
    expect(lifetimeStats(remaining)).toEqual({ earned: 120, spent: 0 })
  })

  it('returns spent points and drops them from lifetime spend', () => {
    const purchase = spend(45)
    expect(balanceAfterRemoval(20, purchase)).toBe(65)
    expect(lifetimeStats([purchase].filter((tx) => tx.id !== purchase.id))).toEqual({ earned: 0, spent: 0 })
    expect(lifetimeStats([purchase])).toEqual({ earned: 0, spent: 45 })
  })

  it('does not drive the balance below zero', () => {
    expect(balanceAfterRemoval(10, earn('2026-10-21', 40))).toBe(0)
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

describe('demo mode', () => {
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
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fills sample data and restores the previous ledger', () => {
    const current = {
      ...freshState(),
      balance: 12,
      apiKey: 'kept-key',
      theme: 'dark' as const,
      disciplineAnchor: 'Ship the lab',
      vaultItems: [
        {
          id: 'real',
          title: 'Tea',
          cost: 40,
          category: 'Items' as const,
          usd: 2,
          hrs: 0,
          formulaTag: '$2 @ 20 PTS/$',
        },
      ],
    }
    const demo = enterDemo(current)
    const today = utcDateKey()

    expect(demo.demoMode).toBe(true)
    expect(demo.apiKey).toBe('kept-key')
    expect(demo.theme).toBe('dark')
    expect(demo.disciplineAnchor).toBe(DEMO_ANCHOR)
    expect(earnedOn(demo.transactions, today)).toBeGreaterThanOrEqual(120)
    expect(currentStreak(demo.transactions, today)).toBeGreaterThanOrEqual(2)
    expect(demo.transactions.some((tx) => tx.weight_class?.startsWith('Heavyweight'))).toBe(true)
    expect(demo.transactions.some((tx) => tx.weight_class?.startsWith('Cruiserweight'))).toBe(true)
    expect(demo.transactions.some((tx) => tx.weight_class?.startsWith('Middleweight'))).toBe(true)
    expect(demo.transactions.some((tx) => tx.type === 'SPEND')).toBe(true)
    expect(demo.vaultItems.map((item) => item.category).sort()).toEqual(['Dining', 'Events', 'Gaming', 'Items'])
    const net = demo.transactions.reduce((sum, tx) => sum + (tx.type === 'EARN' ? tx.points : -tx.points), 0)
    expect(demo.balance).toBe(net)
    const coffee = demo.vaultItems.find((item) => item.title === 'Coffee')
    const lunch = demo.vaultItems.find((item) => item.title === 'Lunch')
    const show = demo.vaultItems.find((item) => item.title === 'Show ticket')
    expect(coffee && demo.balance >= coffee.cost).toBe(true)
    expect(lunch && demo.balance < lunch.cost).toBe(true)
    expect(show && demo.balance < show.cost).toBe(true)

    const again = enterDemo({ ...demo, balance: 1 })
    expect(readDemoSnapshot()?.balance).toBe(12)

    const back = exitDemo({ ...again, theme: 'light', apiKey: '' })
    expect(back.demoMode).toBe(false)
    expect(back.balance).toBe(12)
    expect(back.disciplineAnchor).toBe('Ship the lab')
    expect(back.vaultItems).toEqual(current.vaultItems)
    expect(back.theme).toBe('dark')
    expect(back.apiKey).toBe('kept-key')
    expect(readDemoSnapshot()).toBeNull()
  })

  it('offers ready-to-submit form values', () => {
    expect(DEMO_ACTION.text.trim().length).toBeGreaterThan(0)
    expect(DEMO_ACTION.duration).toBe(45)
    expect(validateVaultDraft(DEMO_SPEND.category, Number(DEMO_SPEND.usd), Number(DEMO_SPEND.hrs) || 0)).toEqual({ ok: true })
    expect(validateVaultDraft(DEMO_BOUNTY.category, Number(DEMO_BOUNTY.usd), Number(DEMO_BOUNTY.hrs))).toEqual({ ok: true })
    expect(DEMO_ANCHOR).not.toBe(DEFAULT_ANCHOR)
  })
})
