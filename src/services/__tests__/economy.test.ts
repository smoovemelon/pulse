import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANCHOR, localDateKey } from '../../lib/dates'
import { greetingDate, greetingLine } from '../../lib/greeting'
import type { PulseState, Transaction } from '../../types'
import { runDecayAudit } from '../audit'
import { disciplineDefaults } from '../engine'
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
    lastAuditDate: '2026-10-20',
    apiKey: '',
    disciplineAnchor: DEFAULT_ANCHOR,
    dailyGoal: 120,
    theme: 'light',
    demoMode: false,
    streakState: 'STALLED',
    username: '',
    isOnboarded: false,
    transactions: [],
    vaultItems: [],
    ...disciplineDefaults(new Date('2026-10-21T15:00:00Z')),
    ...partial,
    forgeStreak: partial.forgeStreak ?? partial.streakCount ?? 0,
    streakCount: partial.streakCount ?? partial.forgeStreak ?? 0,
  }
}

describe('action evaluation', () => {
  it('scales a middleweight session from 15m through 45m to 90m', () => {
    const short = score(8, 5, 15)
    const baseline = score(8, 5, 45)
    const long = score(8, 5, 90)

    expect(short).toMatchObject({ duration: 15, basePoints: 39, multiplier: 1, points: 39, weightClass: 'Middleweight (1.0x)' })
    expect(baseline).toMatchObject({ duration: 45, basePoints: 64, multiplier: 1, points: 64 })
    expect(long).toMatchObject({ duration: 90, basePoints: 87, multiplier: 1, points: 87 })
    expect(short.points).toBeLessThan(baseline.points)
    expect(baseline.points).toBeLessThan(long.points)
    expect(baseline.breakdown).toBe('Base: 64 (Strain 8.0 @ 45m) × 1x (Middleweight)')
  })

  it('applies heavyweight, cruiserweight, and middleweight multipliers at a 45m baseline', () => {
    const heavy = score(10, 8, 45)
    const cruiser = score(10, 6, 45)
    const middle = score(10, 4, 45)

    expect(heavy).toMatchObject({ basePoints: 80, multiplier: 2, points: 160, weightClass: 'Heavyweight (2.0x)' })
    expect(cruiser).toMatchObject({ basePoints: 80, multiplier: 1.5, points: 120, weightClass: 'Cruiserweight (1.5x)' })
    expect(middle).toMatchObject({ basePoints: 80, multiplier: 1, points: 80, weightClass: 'Middleweight (1.0x)' })
    expect(score(10, 3.99, 45)).toMatchObject({ multiplier: 0.5, points: 40, weightClass: 'Lightweight (0.5x)' })
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

  it('pays middleweight baseline for a specific direct log under 7', () => {
    const middle = evaluateAnchorAction({
      strain: 10,
      alignment: 5,
      valid: true,
      duration: 45,
      title: 'Notes',
      raw: 'Reviewed 4 pages of notes',
      reasoning: 'Direct, but not a heavy session.',
    })

    expect(middle.partial).toBe(false)
    expect(middle.multiplier).toBe(1)
    expect(middle.weightClass).toBe('Middleweight (1.0x)')
    expect(middle.points).toBe(80)
    expect(middle.alignment).toBe(5)

    const cruiserBand = evaluateAnchorAction({
      strain: 10,
      alignment: 6,
      valid: true,
      duration: 45,
      title: 'Review',
      raw: 'Reviewed 12 pages of notes',
      reasoning: 'Solid direct work.',
    })
    expect(cruiserBand.multiplier).toBe(1.5)
    expect(cruiserBand.weightClass).toBe('Cruiserweight (1.5x)')

    const under = evaluateAnchorAction({
      strain: 10,
      alignment: 3.5,
      valid: true,
      duration: 45,
      title: 'Notes',
      raw: 'Reviewed 4 pages of notes',
      reasoning: 'Too light to clear the line.',
    })
    expect(under.multiplier).toBe(0.5)
    expect(under.weightClass).toBe('Lightweight (0.5x)')
    expect(under.partial).toBe(true)
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
    expect(offline.multiplier).toBe(1)
    expect(offline.partial).toBe(false)
    expect(offline.weightClass).toBe('Middleweight (1.0x)')
    expect(offline.strain).toBe(6)
    expect(offline.title).toBe('Morning study block on problem sets')
    expect(offline.title).not.toContain('Brandon')
    expect(localActionFallback('push day', 60, '').title).toBe('push day')
    expect(localActionFallback('   ', 30, '').title).toBe('30-Min Logged Session')
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
    expect(result.alert).toEqual({ earned: 59, penalty: 15, target: 120 })
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
    expect(result.state.transactions[0]?.is_locked).toBe(true)
    expect(result.state.transactions[0]?.reasoning).toContain('Uncollected 5 PTS')
    expect(result.state.transactions[0]?.date).toBe('2026-10-20')
  })

  it('closes each missed day instead of skipping ahead', () => {
    const result = runDecayAudit(
      ledger({
        balance: 200,
        streakCount: 3,
        lastAuditDate: '2026-10-18',
        transactions: [earn('2026-10-18', 10), earn('2026-10-19', 70), earn('2026-10-20', 120)],
      }),
    )

    expect(result.state.lastAuditDate).toBe('2026-10-21')
    expect(result.state.balance).toBe(185)
    expect(result.state.streakCount).toBe(1)
    expect(result.state.streakState).toBe('SECURED')
    const decays = result.state.transactions.filter((tx) => tx.category === 'Decay Audit')
    expect(decays).toHaveLength(1)
    expect(decays[0]).toMatchObject({ date: '2026-10-18', points: 15, is_locked: true })
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

  it('leaves the balance unchanged when a decay row is removed', () => {
    const decay: Transaction = {
      id: 'decay',
      type: 'SPEND',
      title: 'Discipline Decay: Target Missed',
      points: 15,
      timestamp: '2026-10-20T17:00:00.000Z',
      date: '2026-10-20',
      category: 'Decay Audit',
    }
    expect(balanceAfterRemoval(40, decay)).toBe(40)
  })
})

describe('vault category validation', () => {
  it('requires minutes for time and dollars for money', () => {
    expect(validateVaultDraft('time', 0)).toEqual({ ok: false, message: 'Enter a duration in minutes.' })
    expect(validateVaultDraft('money', 0)).toEqual({ ok: false, message: 'Enter a price in dollars.' })
    expect(validateVaultDraft('time', 90)).toEqual({ ok: true })
    expect(validateVaultDraft('money', 12)).toEqual({ ok: true })
  })
})

describe('streak multiplier', () => {
  it('leaves judged points unscaled', () => {
    expect(streakMultiplier(14)).toBe(1)
    expect(applyStreakBonus(100, 14)).toBe(100)
    expect(applyStreakBonus(84, 7)).toBe(84)
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
          category: 'gear' as const,
          measurementType: 'money' as const,
          priceDollars: 2,
          baseCost: 40,
          createdAt: '2026-10-21T00:00:00.000Z',
        },
      ],
    }
    const demo = enterDemo(current)
    const today = localDateKey()

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
    expect(demo.vaultItems.map((item) => item.category).sort()).toEqual(['dining', 'gaming', 'gear', 'outings'])
    const net = demo.transactions.reduce((sum, tx) => sum + (tx.type === 'EARN' ? tx.points : -tx.points), 0)
    expect(demo.balance).toBe(net)
    const coffee = demo.vaultItems.find((item) => item.title === 'Coffee')
    const lunch = demo.vaultItems.find((item) => item.title === 'Lunch')
    const show = demo.vaultItems.find((item) => item.title === 'Show ticket')
    expect(coffee && demo.balance >= coffee.baseCost).toBe(true)
    expect(lunch && demo.balance < lunch.baseCost).toBe(true)
    expect(show && demo.balance < show.baseCost).toBe(true)

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
    expect(validateVaultDraft(DEMO_SPEND.measurementType, Number(DEMO_SPEND.amount))).toEqual({ ok: true })
    expect(validateVaultDraft(DEMO_BOUNTY.measurementType, Number(DEMO_BOUNTY.amount))).toEqual({ ok: true })
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
      vaultItems: [{ id: 'v', title: 'Coffee', category: 'gear', measurementType: 'money', priceDollars: 5, baseCost: 100, createdAt: '2026-10-21T00:00:00.000Z' }],
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
