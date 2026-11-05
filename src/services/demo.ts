import { localDateKey } from '../lib/dates'
import type { ActionJudgmentResult, PulseState, Transaction, VaultCategory, VaultItem } from '../types'
import { BALANCED_ECONOMY, calculateVaultValuation, replayStreak, scoreJudgment } from './engine'
import { clearDemoSnapshot, readDemoSnapshot, saveDemoSnapshot } from './persistence'

export const DEMO_ANCHOR = 'Be a studious student.'

export const DEMO_ACTION = {
  text: 'Morning study block on problem sets',
  duration: 45,
} as const

export const DEMO_SPEND = {
  title: 'Coffee',
  category: 'items' as const,
  measurementType: 'money' as const,
  amount: '5',
}

export const DEMO_BOUNTY = {
  title: 'Dinner out',
  category: 'food' as const,
  measurementType: 'money' as const,
  amount: '18',
}

function daysBefore(days: number) {
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - days)
  return localDateKey(cursor)
}

function atLocal(dateKey: string, hours: number, minutes: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

function earn(
  id: string,
  title: string,
  judgment: ActionJudgmentResult,
  minutes: number,
  daysAgo: number,
  hours: number,
  minutesOfDay: number,
): Transaction {
  const date = daysBefore(daysAgo)
  const score = scoreJudgment(judgment, title, minutes)
  return {
    id,
    type: 'EARN',
    title: score.title,
    points: score.points,
    timestamp: atLocal(date, hours, minutesOfDay),
    date,
    reasoning: score.reasoning,
    formula_breakdown: score.breakdown,
    effort_strain: score.strain,
    anchor_alignment: score.alignment,
    multiplier: score.multiplier,
    weight_class: score.weightClass,
  }
}

function bounty(id: string, title: string, category: VaultCategory, measurement: 'time' | 'money', amount: number): VaultItem {
  const quote = calculateVaultValuation(measurement, amount, BALANCED_ECONOMY)
  return {
    id,
    title,
    category,
    measurementType: measurement,
    durationMinutes: measurement === 'time' ? amount : 0,
    priceDollars: measurement === 'money' ? amount : 0,
    baseCost: quote.cost,
    createdAt: '2026-10-21T00:00:00.000Z',
  }
}

function demoTransactions(): readonly Transaction[] {
  const coffee = calculateVaultValuation('money', 5, BALANCED_ECONOMY)
  return [
    {
      id: 'demo-spend-coffee',
      type: 'SPEND',
      title: 'Coffee',
      points: coffee.cost,
      category: 'items',
      formula_breakdown: coffee.tag,
      timestamp: atLocal(daysBefore(0), 8, 5),
      date: daysBefore(0),
    },
    earn(
      'demo-earn-problems',
      'Problem set block',
      { strain: 'HIGH', relevance: 'DIRECT', weightClass: 'HEAVYWEIGHT', reasoning: 'Heavy session. The work sat directly on the anchor.' },
      60,
      0,
      9,
      0,
    ),
    earn(
      'demo-earn-review',
      'Review notes',
      { strain: 'MEDIUM', relevance: 'DIRECT', weightClass: 'CRUISERWEIGHT', reasoning: 'Cruiserweight review. Useful, and shorter than the morning block.' },
      45,
      0,
      16,
      15,
    ),
    earn(
      'demo-earn-library',
      'Library session',
      { strain: 'HIGH', relevance: 'DIRECT', weightClass: 'HEAVYWEIGHT', reasoning: 'Yesterday cleared the daily target.' },
      75,
      1,
      19,
      10,
    ),
    earn(
      'demo-earn-stretch',
      'Short stretch',
      { strain: 'LOW', relevance: 'GENERAL', weightClass: 'LIGHTWEIGHT', reasoning: 'Light work. It did not clear the daily target.' },
      20,
      2,
      18,
      0,
    ),
  ]
}

function demoVault(): readonly VaultItem[] {
  return [
    bounty('demo-vault-coffee', 'Coffee', 'items', 'money', 5),
    bounty('demo-vault-queue', 'Ranked queue', 'gaming', 'time', 60),
    bounty('demo-vault-lunch', 'Lunch', 'food', 'money', 20),
    bounty('demo-vault-show', 'Show ticket', 'events', 'money', 80),
  ]
}

export function buildDemoState(current: PulseState): PulseState {
  const transactions = demoTransactions()
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === 'EARN' ? tx.points : -tx.points), 0)
  const streak = replayStreak(transactions, localDateKey())
  return {
    ...current,
    demoMode: true,
    balance: Math.max(0, balance),
    disciplineAnchor: DEMO_ANCHOR,
    lastAuditDate: localDateKey(),
    streakCount: streak.streakCount,
    forgeStreak: streak.streakCount,
    streakState: streak.streakState,
    transactions,
    vaultItems: demoVault(),
  }
}

export function enterDemo(current: PulseState): PulseState {
  if (!current.demoMode) saveDemoSnapshot(current)
  return buildDemoState(current)
}

export function exitDemo(current: PulseState): PulseState {
  const saved = readDemoSnapshot()
  clearDemoSnapshot()
  if (!saved) {
    return {
      ...current,
      demoMode: false,
      balance: 0,
      transactions: [],
      vaultItems: [],
    }
  }
  return {
    ...saved,
    demoMode: false,
    username: saved.username || current.username,
    isOnboarded: saved.isOnboarded || current.isOnboarded,
  }
}
