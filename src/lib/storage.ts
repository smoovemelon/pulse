import { DAILY_GOAL, DEFAULT_ANCHOR, utcDateKey } from './dates'
import type { PulseState, ThemeName, Transaction, VaultItem } from '../types'

const KEYS = {
  balance: 'pulse_balance',
  txs: 'pulse_txs',
  vault: 'pulse_vault',
  anchor: 'pulse_anchor',
  sound: 'pulse_sound',
  decay: 'pulse_decay',
  audit: 'pulse_last_audit',
  apiKey: 'pulse_gemini_key',
  theme: 'pulse_theme',
} as const

function seedTransactions(): Transaction[] {
  return [
    {
      id: 'tx-1',
      type: 'EARN',
      title: '60-Min Push Session w/ Brandon',
      points: 84,
      effort_strain: 7,
      anchor_alignment: 8.5,
      multiplier: 1.5,
      weight_class: 'Cruiserweight (1.5x)',
      reasoning: 'Directly reinforces primary physical target with heavy compound overload.',
      formula_breakdown: 'Base 56 × 1.5x Multiplier',
      timestamp: 'Today, 2:15 PM',
      date: utcDateKey(),
    },
    {
      id: 'tx-2',
      type: 'SPEND',
      title: '1 Hour of Valorant Session',
      points: 50,
      category: 'Gaming',
      timestamp: 'Yesterday, 8:30 PM',
      date: utcDateKey(new Date(Date.now() - 86_400_000)),
    },
  ]
}

function seedVault(): VaultItem[] {
  return [
    {
      id: 'v-1',
      title: '1 Hour of Valorant Session',
      cost: 50,
      category: 'Gaming',
      usd: 0,
      hrs: 1,
      formulaTag: '1.0 hrs @ 50 PTS/hr',
    },
    {
      id: 'v-2',
      title: 'Korean BBQ Dinner',
      cost: 770,
      category: 'Dining',
      usd: 35,
      hrs: 2,
      formulaTag: '$35 + 2.0 hrs',
    },
    {
      id: 'v-3',
      title: 'Jonsbo N4 NAS Chassis',
      cost: 1600,
      category: 'Items',
      usd: 80,
      hrs: 0,
      formulaTag: '$80 @ 20 PTS/$',
    },
  ]
}

function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadState(): PulseState {
  const balanceRaw = localStorage.getItem(KEYS.balance)
  const balance = balanceRaw === null || Number.isNaN(Number(balanceRaw)) ? 420 : Number(balanceRaw)
  const transactions = readJson<Transaction[]>(KEYS.txs) ?? seedTransactions()
  const vaultItems = readJson<VaultItem[]>(KEYS.vault) ?? seedVault()
  const theme: ThemeName = localStorage.getItem(KEYS.theme) === 'dark' ? 'dark' : 'light'

  return {
    balance,
    soundEnabled: localStorage.getItem(KEYS.sound) !== 'false',
    decayEnabled: localStorage.getItem(KEYS.decay) !== 'false',
    lastAuditDate: localStorage.getItem(KEYS.audit) || utcDateKey(),
    apiKey: localStorage.getItem(KEYS.apiKey) || '',
    disciplineAnchor: localStorage.getItem(KEYS.anchor) || DEFAULT_ANCHOR,
    dailyGoal: DAILY_GOAL,
    theme,
    transactions,
    vaultItems,
  }
}

export function saveState(state: PulseState) {
  localStorage.setItem(KEYS.balance, String(state.balance))
  localStorage.setItem(KEYS.txs, JSON.stringify(state.transactions))
  localStorage.setItem(KEYS.vault, JSON.stringify(state.vaultItems))
  localStorage.setItem(KEYS.anchor, state.disciplineAnchor)
  localStorage.setItem(KEYS.sound, String(state.soundEnabled))
  localStorage.setItem(KEYS.decay, String(state.decayEnabled))
  localStorage.setItem(KEYS.audit, state.lastAuditDate)
  localStorage.setItem(KEYS.theme, state.theme)
  if (state.apiKey) localStorage.setItem(KEYS.apiKey, state.apiKey)
  else localStorage.removeItem(KEYS.apiKey)
}

export function exportBackup(state: PulseState) {
  const backup = {
    app: 'Pulse Productivity Economy',
    version: '1.3.0',
    exported_at: new Date().toISOString(),
    state: {
      balance: state.balance,
      anchor: state.disciplineAnchor,
      soundEnabled: state.soundEnabled,
      decayEnabled: state.decayEnabled,
      transactions: state.transactions,
      vaultItems: state.vaultItems,
    },
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pulse_backup_${utcDateKey()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function mergeBackup(current: PulseState, parsed: unknown): PulseState {
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup JSON file')
  const record = parsed as { state?: unknown }
  const source = (record.state && typeof record.state === 'object' ? record.state : parsed) as Record<
    string,
    unknown
  >
  const next: PulseState = { ...current, transactions: [...current.transactions], vaultItems: [...current.vaultItems] }

  if (typeof source.balance === 'number' && Number.isFinite(source.balance)) next.balance = source.balance
  if (typeof source.anchor === 'string' && source.anchor.trim()) next.disciplineAnchor = source.anchor.trim()
  if (Array.isArray(source.transactions)) next.transactions = source.transactions as Transaction[]
  if (Array.isArray(source.vaultItems)) next.vaultItems = source.vaultItems as VaultItem[]
  if (typeof source.decayEnabled === 'boolean') next.decayEnabled = source.decayEnabled
  if (typeof source.soundEnabled === 'boolean') next.soundEnabled = source.soundEnabled

  return next
}
