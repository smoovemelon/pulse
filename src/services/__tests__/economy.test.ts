import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANCHOR, utcDateKey } from '../../lib/dates'
import { greetingDate, greetingLine } from '../../lib/greeting'
import type { PulseState, Transaction } from '../../types'
import { runDecayAudit } from '../audit'
import { DEMO_ACTION, DEMO_ANCHOR, DEMO_BOUNTY, DEMO_SPEND, enterDemo, exitDemo } from '../demo'
import { balanceAfterRemoval, calculateActionPoints, currentStreak, earnedOn, evaluateAnchorAction, lifetimeStats, localActionFallback, validateVaultDraft } from '../economy'
import { applyStreakBonus, streakMultiplier, weekStrip } from '../engine'
import { shouldIntroduce } from '../intro'
import { clearIntroSeen, freshState, hasSeenIntro, markIntroSeen, readDemoSnapshot } from '../persistence'

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
    streakCount: 0,
    streakState: 'STALLED',
    username: '',
    isOnboarded: false,
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

  it('pays half credit for productive work that misses the anchor', () => {
    const off = evaluateAnchorAction({
      strain: 10,
      alignment: 9,
      valid: false,
      duration: 45,
      title: 'Hydration',
      raw: 'Drank 2 glasses of water',
      reasoning: 'Useful, but not the anchor.',
      rejectionReason: 'Water does not move the anchor.',
    })
    const on = evaluateAnchorAction({
      strain: 10,
      alignment: 9,
      valid: true,
      duration: 45,
      title: 'Problem sets',
      raw: 'Finished 20 problem sets',
      reasoning: 'Direct practice toward the anchor.',
    })

    expect(off.partial).toBe(true)
    expect(off.multiplier).toBe(0.5)
    expect(off.weightClass).toBe('Lightweight (0.5x)')
    expect(off.points).toBe(40)
    expect(off.points).toBeLessThan(on.points)
    expect(on.partial).toBe(false)
    expect(on.multiplier).toBe(2)
    expect(on.points).toBe(160)
  })

  it('keeps a specific anchor hit at cruiserweight once alignment clears 7', () => {
    const cruiser = evaluateAnchorAction({
      strain: 10,
      alignment: 7,
      valid: true,
      duration: 45,
      title: 'Review',
      raw: 'Reviewed 12 pages of notes',
      reasoning: 'Close work on the anchor.',
    })

    expect(cruiser.multiplier).toBe(1.5)
    expect(cruiser.points).toBe(120)
    expect(cruiser.partial).toBe(false)
  })

  it('withholds the anchor bonus when the log names no concrete result', () => {
    const vague = evaluateAnchorAction({
      strain: 10,
      alignment: 9,
      valid: true,
      duration: 45,
      title: 'Workout',
      raw: 'worked out',
      reasoning: 'Too vague to confirm.',
    })

    expect(vague.partial).toBe(true)
    expect(vague.multiplier).toBe(0.5)
    expect(vague.points).toBe(40)
  })

  it('does not grant cruiserweight when the anchor cannot be checked', () => {
    const offline = localActionFallback('Morning study block on problem sets', 45, 'offline')
    expect(offline.multiplier).toBe(0.5)
    expect(offline.partial).toBe(true)
    expect(offline.points).toBeGreaterThan(0)
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

  it('holds the streak without a fee when the missed day lands in the grace band', () => {
    const result = runDecayAudit(
      ledger({
        balance: 200,
        streakCount: 4,
        transactions: [earn('2026-10-20', 119)],
      }),
    )

    expect(result.met).toBe(false)
    expect(result.alert).toBeNull()
    expect(result.earned).toBe(119)
    expect(result.state.balance).toBe(200)
    expect(result.state.streakCount).toBe(4)
    expect(result.state.streakState).toBe('SAFE')
    expect(result.state.lastAuditDate).toBe('2026-10-21')
    expect(result.state.transactions.every((tx) => tx.category !== 'Decay Audit')).toBe(true)
    expect(localStorage.getItem('pulse_last_audit')).toBe('2026-10-21')
  })

  it('resets the streak and charges 15 PTS when the day closes under 60', () => {
    const result = runDecayAudit(
      ledger({
        balance: 200,
        streakCount: 4,
        streakState: 'SECURED',
        transactions: [earn('2026-10-20', 59)],
      }),
    )

    expect(result.met).toBe(false)
    expect(result.alert).toEqual({ earned: 59 })
    expect(result.state.balance).toBe(185)
    expect(result.state.streakCount).toBe(0)
    expect(result.state.streakState).toBe('STALLED')
    expect(result.state.transactions[0]).toMatchObject({
      type: 'SPEND',
      title: 'Discipline Decay: Target Missed',
      points: 15,
      category: 'Decay Audit',
    })
  })

  it('adds a secured day and leaves the balance when the day clears 120', () => {
    const result = runDecayAudit(
      ledger({
        balance: 200,
        streakCount: 2,
        transactions: [earn('2026-10-20', 120)],
      }),
    )

    expect(result.met).toBe(true)
    expect(result.alert).toBeNull()
    expect(result.state.balance).toBe(200)
    expect(result.state.streakCount).toBe(3)
    expect(result.state.streakState).toBe('SECURED')
  })

  it('does not apply the same closed day twice', () => {
    const first = runDecayAudit(
      ledger({
        streakCount: 1,
        transactions: [earn('2026-10-21', 130)],
      }),
      true,
    )
    const second = runDecayAudit(first.state, true)

    expect(first.state.streakCount).toBe(2)
    expect(second.state.streakCount).toBe(2)
    expect(second.state.balance).toBe(first.state.balance)
    expect(second.alert).toBeNull()
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

describe('streak multiplier', () => {
  it('steps from 1.0x through 1.3x and rounds the bonus onto the points', () => {
    expect(streakMultiplier(0)).toBe(1)
    expect(streakMultiplier(2)).toBe(1)
    expect(streakMultiplier(3)).toBe(1.1)
    expect(streakMultiplier(6)).toBe(1.1)
    expect(streakMultiplier(7)).toBe(1.2)
    expect(streakMultiplier(13)).toBe(1.2)
    expect(streakMultiplier(14)).toBe(1.3)
    expect(streakMultiplier(40)).toBe(1.3)
    expect(applyStreakBonus(100, 2)).toBe(100)
    expect(applyStreakBonus(100, 3)).toBe(110)
    expect(applyStreakBonus(84, 7)).toBe(101)
    expect(applyStreakBonus(100, 14)).toBe(130)
  })

  it('marks the Monday-start week from secured, grace, today, and later days', () => {
    const days = weekStrip(
      [earn('2026-10-19', 120), earn('2026-10-20', 80), earn('2026-10-21', 30)],
      '2026-10-21',
    )
    expect(days.map((day) => day.label)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    expect(days.map((day) => day.mark)).toEqual(['secured', 'grace', 'today', 'upcoming', 'upcoming', 'upcoming', 'upcoming'])
    expect(days[2]?.earned).toBe(30)
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

describe('intro', () => {
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

  it('opens for an empty unnamed profile and stays closed once seen or used', () => {
    expect(shouldIntroduce(freshState())).toBe(true)

    markIntroSeen()
    expect(hasSeenIntro()).toBe(true)
    expect(shouldIntroduce(freshState())).toBe(false)

    clearIntroSeen()
    expect(shouldIntroduce({ ...freshState(), balance: 12 })).toBe(false)
    expect(shouldIntroduce({ ...freshState(), transactions: [earn('2026-10-21', 40)] })).toBe(false)
    expect(shouldIntroduce({
      ...freshState(),
      vaultItems: [{ id: 'v', title: 'Coffee', cost: 100, category: 'Items', usd: 5, hrs: 0, formulaTag: 'USD' }],
    })).toBe(false)
    expect(shouldIntroduce({ ...freshState(), disciplineAnchor: 'Be a studious student.' })).toBe(false)
    expect(shouldIntroduce(freshState())).toBe(true)
  })
})

describe('greeting', () => {
  it('names the part of day and lowercases the handle', () => {
    expect(greetingLine(5, '')).toBe('good morning.')
    expect(greetingLine(11, 'Adrinn')).toBe('good morning, adrinn.')
    expect(greetingLine(12, 'adrinn')).toBe('good afternoon, adrinn.')
    expect(greetingLine(16, '  Adrinn  ')).toBe('good afternoon, adrinn.')
    expect(greetingLine(17, '')).toBe('good evening.')
    expect(greetingLine(4, 'adrinn')).toBe('good evening, adrinn.')
    expect(greetingLine(0, '')).toBe('good evening.')
  })

  it('writes the date as a weekday, a padded day, and the month', () => {
    expect(greetingDate(new Date(2026, 9, 21))).toBe('Wednesday, 21 October.')
  })
})
