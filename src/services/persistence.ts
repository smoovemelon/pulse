import { DAILY_GOAL, DEFAULT_ANCHOR, utcDateKey } from '../lib/dates'
import { resolveStreak } from './engine'
import type {
  PulseState,
  SpendCategory,
  ThemeName,
  Transaction,
  VaultCategory,
  VaultItem,
  WeightClass,
} from '../types'

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
  profile: 'pulse_profile',
  demo: 'pulse_demo',
  demoSnapshot: 'pulse_demo_snapshot',
  intro: 'pulse_intro',
  streakCount: 'pulse_streak_count',
  streakState: 'pulse_streak_state',
} as const

const FRESH_PROFILE = 'fresh-1'
const LEGACY_ANCHOR = 'Paused Bench Press 205 lbs'

const WEIGHT_CLASSES = ['Heavyweight (2.0x)', 'Cruiserweight (1.5x)', 'Middleweight (1.0x)'] as const
const VAULT_CATEGORIES = ['Gaming', 'Items', 'Dining', 'Events'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWeightClass(value: unknown): value is WeightClass {
  return typeof value === 'string' && (WEIGHT_CLASSES as readonly string[]).includes(value)
}

function isVaultCategory(value: unknown): value is VaultCategory {
  return typeof value === 'string' && (VAULT_CATEGORIES as readonly string[]).includes(value)
}

function isSpendCategory(value: unknown): value is SpendCategory {
  return isVaultCategory(value) || value === 'Decay Audit'
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function parseTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) return null
  if (value.type !== 'EARN' && value.type !== 'SPEND') return null
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null
  const points = finiteNumber(value.points)
  if (points === undefined) return null
  if (typeof value.timestamp !== 'string') return null

  const shared = {
    id: value.id,
    title: value.title,
    points,
    timestamp: value.timestamp,
    date: typeof value.date === 'string' ? value.date : '',
    reasoning: optionalText(value.reasoning),
    formula_breakdown: optionalText(value.formula_breakdown),
    effort_strain: finiteNumber(value.effort_strain),
    anchor_alignment: finiteNumber(value.anchor_alignment),
    multiplier: finiteNumber(value.multiplier),
    weight_class: isWeightClass(value.weight_class) ? value.weight_class : undefined,
  }

  if (value.type === 'EARN') {
    return {
      ...shared,
      type: 'EARN',
      category: isVaultCategory(value.category) ? value.category : undefined,
    }
  }

  return {
    ...shared,
    type: 'SPEND',
    category: isSpendCategory(value.category) ? value.category : undefined,
  }
}

export function parseTransactions(value: unknown): readonly Transaction[] | null {
  if (!Array.isArray(value)) return null
  const rows = value.map(parseTransaction).filter((row): row is Transaction => row !== null)
  if (value.length > 0 && rows.length === 0) return null
  return rows
}

export function parseVaultItem(value: unknown): VaultItem | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return null
  if (!isVaultCategory(value.category)) return null
  const cost = finiteNumber(value.cost)
  const usd = finiteNumber(value.usd)
  const hrs = finiteNumber(value.hrs)
  if (cost === undefined || usd === undefined || hrs === undefined) return null
  if (typeof value.formulaTag !== 'string') return null
  return {
    id: value.id,
    title: value.title,
    cost,
    category: value.category,
    usd,
    hrs,
    formulaTag: value.formulaTag,
  }
}

export function parseVaultItems(value: unknown): readonly VaultItem[] | null {
  if (!Array.isArray(value)) return null
  const rows = value.map(parseVaultItem).filter((row): row is VaultItem => row !== null)
  if (value.length > 0 && rows.length === 0) return null
  return rows
}

function readUnknown(key: string): unknown {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function freshState(): PulseState {
  return {
    balance: 0,
    soundEnabled: true,
    decayEnabled: true,
    lastAuditDate: utcDateKey(),
    apiKey: '',
    disciplineAnchor: DEFAULT_ANCHOR,
    dailyGoal: DAILY_GOAL,
    theme: 'light',
    demoMode: false,
    streakCount: 0,
    streakState: 'STALLED',
    transactions: [],
    vaultItems: [],
  }
}

export function readStoredTheme(): ThemeName {
  return localStorage.getItem(KEYS.theme) === 'dark' ? 'dark' : 'light'
}

export function canvasThemeColor(theme: ThemeName = readStoredTheme()) {
  return theme === 'dark' ? '#09090B' : '#F4F4F5'
}

export function applyDocumentTheme(theme: ThemeName = readStoredTheme()) {
  const color = canvasThemeColor(theme)
  const scheme = theme === 'dark' ? 'only dark' : 'only light'
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.backgroundColor = color
  root.style.colorScheme = scheme
  document.body.style.backgroundColor = color
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', color)
  })
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', scheme)
}

function readAnchor(): string {
  const stored = localStorage.getItem(KEYS.anchor)?.trim() ?? ''
  if (!stored || stored === LEGACY_ANCHOR) return DEFAULT_ANCHOR
  return stored
}

export function loadState(): PulseState {
  if (localStorage.getItem(KEYS.profile) !== FRESH_PROFILE) {
    const next = freshState()
    saveState(next)
    localStorage.setItem(KEYS.profile, FRESH_PROFILE)
    return next
  }

  const balanceRaw = localStorage.getItem(KEYS.balance)
  const balance = balanceRaw === null || Number.isNaN(Number(balanceRaw)) ? 0 : Number(balanceRaw)
  const storedTx = localStorage.getItem(KEYS.txs)
  const storedVault = localStorage.getItem(KEYS.vault)
  const transactions = storedTx === null ? [] : (parseTransactions(readUnknown(KEYS.txs)) ?? [])
  const storedCount = localStorage.getItem(KEYS.streakCount)
  const streak = resolveStreak(
    storedCount === null ? undefined : Number(storedCount),
    localStorage.getItem(KEYS.streakState),
    transactions,
  )

  return {
    balance,
    soundEnabled: localStorage.getItem(KEYS.sound) !== 'false',
    decayEnabled: localStorage.getItem(KEYS.decay) !== 'false',
    lastAuditDate: localStorage.getItem(KEYS.audit) || utcDateKey(),
    apiKey: localStorage.getItem(KEYS.apiKey) || '',
    disciplineAnchor: readAnchor(),
    dailyGoal: DAILY_GOAL,
    theme: readStoredTheme(),
    demoMode: localStorage.getItem(KEYS.demo) === 'true',
    streakCount: streak.streakCount,
    streakState: streak.streakState,
    transactions,
    vaultItems: storedVault === null ? [] : (parseVaultItems(readUnknown(KEYS.vault)) ?? []),
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
  localStorage.setItem(KEYS.streakCount, String(state.streakCount))
  localStorage.setItem(KEYS.streakState, state.streakState)
  localStorage.setItem(KEYS.theme, state.theme)
  if (state.demoMode) localStorage.setItem(KEYS.demo, 'true')
  else localStorage.removeItem(KEYS.demo)
  if (state.apiKey) localStorage.setItem(KEYS.apiKey, state.apiKey)
  else localStorage.removeItem(KEYS.apiKey)
}

export function saveDemoSnapshot(state: PulseState) {
  localStorage.setItem(KEYS.demoSnapshot, JSON.stringify({ ...state, demoMode: false }))
}

export function readDemoSnapshot(): PulseState | null {
  const raw = localStorage.getItem(KEYS.demoSnapshot)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return null
    const transactions = parseTransactions(parsed.transactions)
    const vaultItems = parseVaultItems(parsed.vaultItems)
    const balance = finiteNumber(parsed.balance)
    if (!transactions || !vaultItems || balance === undefined) return null
    const streak = resolveStreak(finiteNumber(parsed.streakCount), parsed.streakState, transactions)
    return {
      balance,
      soundEnabled: parsed.soundEnabled !== false,
      decayEnabled: parsed.decayEnabled !== false,
      lastAuditDate: typeof parsed.lastAuditDate === 'string' ? parsed.lastAuditDate : utcDateKey(),
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      disciplineAnchor:
        typeof parsed.disciplineAnchor === 'string' && parsed.disciplineAnchor.trim()
          ? parsed.disciplineAnchor.trim()
          : DEFAULT_ANCHOR,
      dailyGoal: DAILY_GOAL,
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      demoMode: false,
      streakCount: streak.streakCount,
      streakState: streak.streakState,
      transactions,
      vaultItems,
    }
  } catch {
    return null
  }
}

export function clearDemoSnapshot() {
  localStorage.removeItem(KEYS.demoSnapshot)
}

export function hasSeenIntro(): boolean {
  return localStorage.getItem(KEYS.intro) === 'seen'
}

export function markIntroSeen() {
  localStorage.setItem(KEYS.intro, 'seen')
}

export function clearIntroSeen() {
  localStorage.removeItem(KEYS.intro)
}

export function exportBackup(state: PulseState) {
  const backup = {
    app: 'Altius',
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
  link.download = `altius_backup_${utcDateKey()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function mergeBackup(current: PulseState, parsed: unknown): PulseState {
  if (!isRecord(parsed)) throw new Error('Invalid backup JSON file')
  const nested = parsed.state
  const source = isRecord(nested) ? nested : parsed
  const balance = finiteNumber(source.balance)
  const transactions = 'transactions' in source ? parseTransactions(source.transactions) : current.transactions
  const vaultItems = 'vaultItems' in source ? parseVaultItems(source.vaultItems) : current.vaultItems
  if ('transactions' in source && !transactions) throw new Error('Invalid backup JSON file')
  if ('vaultItems' in source && !vaultItems) throw new Error('Invalid backup JSON file')

  return {
    ...current,
    balance: balance ?? current.balance,
    disciplineAnchor:
      typeof source.anchor === 'string' && source.anchor.trim() ? source.anchor.trim() : current.disciplineAnchor,
    transactions: transactions ?? current.transactions,
    vaultItems: vaultItems ?? current.vaultItems,
    decayEnabled: typeof source.decayEnabled === 'boolean' ? source.decayEnabled : current.decayEnabled,
    soundEnabled: typeof source.soundEnabled === 'boolean' ? source.soundEnabled : current.soundEnabled,
  }
}
