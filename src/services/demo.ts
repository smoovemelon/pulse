import { utcDateKey } from '../lib/dates'
import type { PulseState, Transaction, VaultCategory, VaultItem } from '../types'
import { calculateActionPoints, calculateVaultValuation } from './engine'
import { clearDemoSnapshot, readDemoSnapshot, saveDemoSnapshot } from './persistence'

export const DEMO_ANCHOR = 'Be a studious student.'

export const DEMO_ACTION = {
  text: 'Morning study block on problem sets',
  duration: 45,
} as const

export const DEMO_SPEND = {
  title: 'Coffee',
  category: 'Items' as const,
  usd: '5',
  hrs: '',
}

export const DEMO_BOUNTY = {
  title: 'Dinner out',
  category: 'Dining' as const,
  usd: '18',
  hrs: '1.5',
}

function daysBefore(days: number) {
  const cursor = new Date()
  cursor.setUTCDate(cursor.getUTCDate() - days)
  return cursor.toISOString().slice(0, 10)
}

function earn(
  id: string,
  title: string,
  strain: number,
  alignment: number,
  minutes: number,
  daysAgo: number,
  timestamp: string,
  reasoning: string,
): Transaction {
  const score = calculateActionPoints(strain, alignment, minutes, title, title, reasoning)
  return {
    id,
    type: 'EARN',
    title: score.title,
    points: score.points,
    timestamp,
    date: daysBefore(daysAgo),
    reasoning: score.reasoning,
    formula_breakdown: score.breakdown,
    effort_strain: score.strain,
    anchor_alignment: score.alignment,
    multiplier: score.multiplier,
    weight_class: score.weightClass,
  }
}

function bounty(id: string, title: string, category: VaultCategory, usd: number, hrs: number): VaultItem {
  const quote = calculateVaultValuation(category, usd, hrs)
  return {
    id,
    title,
    cost: quote.cost,
    category,
    usd: quote.usd,
    hrs: quote.hrs,
    formulaTag: quote.tag,
  }
}

function demoTransactions(): readonly Transaction[] {
  const coffee = calculateVaultValuation('Items', 5, 0)
  return [
    {
      id: 'demo-spend-coffee',
      type: 'SPEND',
      title: 'Coffee',
      points: coffee.cost,
      category: 'Items',
      formula_breakdown: coffee.tag,
      timestamp: 'Today, 8:05 AM',
      date: daysBefore(0),
    },
    earn(
      'demo-earn-problems',
      'Problem set block',
      9,
      9,
      60,
      0,
      'Today, 9:00 AM',
      'Heavy session. The work sat directly on the anchor.',
    ),
    earn(
      'demo-earn-review',
      'Review notes',
      6,
      6,
      45,
      0,
      'Today, 4:15 PM',
      'Cruiserweight review. Useful, and shorter than the morning block.',
    ),
    earn(
      'demo-earn-library',
      'Library session',
      8,
      8.5,
      75,
      1,
      'Yesterday, 7:10 PM',
      'Yesterday cleared the daily target.',
    ),
    earn(
      'demo-earn-stretch',
      'Short stretch',
      3,
      2,
      20,
      2,
      '2 days ago, 6:00 PM',
      'Light middleweight work. It did not clear the daily target.',
    ),
  ]
}

function demoVault(): readonly VaultItem[] {
  return [
    bounty('demo-vault-coffee', 'Coffee', 'Items', 5, 0),
    bounty('demo-vault-queue', 'Ranked queue', 'Gaming', 0, 6),
    bounty('demo-vault-lunch', 'Lunch', 'Dining', 20, 2),
    bounty('demo-vault-show', 'Show ticket', 'Events', 80, 3),
  ]
}

export function buildDemoState(current: PulseState): PulseState {
  const transactions = demoTransactions()
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === 'EARN' ? tx.points : -tx.points), 0)
  return {
    ...current,
    demoMode: true,
    balance: Math.max(0, balance),
    disciplineAnchor: DEMO_ANCHOR,
    lastAuditDate: utcDateKey(),
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
  return { ...saved, demoMode: false }
}
