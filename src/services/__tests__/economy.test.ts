import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANCHOR, localDateKey } from '../../lib/dates'
import { greetingDate, greetingLine } from '../../lib/greeting'
import type { PulseState, Transaction } from '../../types'
import { runDecayAudit } from '../audit'
import { disciplineDefaults } from '../engine'
import { DEMO_ACTION, DEMO_ANCHOR, DEMO_BOUNTY, DEMO_SPEND, enterDemo, exitDemo } from '../demo'
import { balanceAfterRemoval, earnedOn, lifetimeStats, validateVaultDraft, weekStrip } from '../engine'
import { shouldIntroduce } from '../intro'
import { clearIntroSeen, freshState, hasSeenIntro, markIntroSeen, readDemoSnapshot } from '../persistence'

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
    avatar: partial.avatar ?? '',
    forgeStreak: partial.forgeStreak ?? partial.streakCount ?? 0,
    streakCount: partial.streakCount ?? partial.forgeStreak ?? 0,
  }
}

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

  it('removes earned points from the balance, that day’s total, and lifetime earned', () => {
    const today = '2026-10-21'
    const session = earn(today, 120)
    const kept = earn('2026-10-20', 120)
    const history = [session, kept]
    const remaining = history.filter((tx) => tx.id !== session.id)

    expect(balanceAfterRemoval(200, session)).toBe(80)
    expect(earnedOn(history, today)).toBe(120)
    expect(earnedOn(remaining, today)).toBe(0)
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

describe('week strip', () => {
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
          category: 'items' as const,
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
    expect(demo.forgeStreak).toBe(1)
    expect(demo.streakState).toBe('SECURED')
    expect(demo.transactions.some((tx) => tx.weight_class === 'Heavyweight (2.0x)')).toBe(true)
    expect(demo.transactions.some((tx) => tx.weight_class === 'Cruiserweight (1.5x)')).toBe(true)
    expect(demo.transactions.some((tx) => tx.weight_class === 'Lightweight (1.0x)')).toBe(true)
    expect(demo.transactions.every((tx) => !Number.isNaN(Date.parse(tx.timestamp)))).toBe(true)
    expect(demo.transactions.some((tx) => tx.type === 'SPEND')).toBe(true)
    expect(demo.vaultItems.map((item) => item.category).sort()).toEqual(['events', 'food', 'gaming', 'items'])
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
      vaultItems: [{ id: 'v', title: 'Coffee', category: 'items', measurementType: 'money', priceDollars: 5, baseCost: 100, createdAt: '2026-10-21T00:00:00.000Z' }],
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
