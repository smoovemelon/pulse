export type TxType = 'EARN' | 'SPEND'
export type FeedFilter = 'ALL' | 'HEAVY' | 'ALIGNED' | 'SPEND'
export type VaultCategory = 'Gaming' | 'Items' | 'Dining' | 'Events'
export type ThemeName = 'light' | 'dark'
export type FeedbackKind = 'click' | 'earn' | 'spend' | 'error'

export interface Transaction {
  id: string
  type: TxType
  title: string
  points: number
  effort_strain?: number
  anchor_alignment?: number
  multiplier?: number
  weight_class?: string
  reasoning?: string
  formula_breakdown?: string
  category?: string
  timestamp: string
  date: string
}

export interface VaultItem {
  id: string
  title: string
  cost: number
  category: string
  usd: number
  hrs: number
  formulaTag: string
}

export interface PulseState {
  balance: number
  soundEnabled: boolean
  decayEnabled: boolean
  lastAuditDate: string
  apiKey: string
  disciplineAnchor: string
  dailyGoal: number
  theme: ThemeName
  transactions: Transaction[]
  vaultItems: VaultItem[]
}

export interface ActionScore {
  points: number
  strain: number
  alignment: number
  multiplier: number
  weightClass: string
  duration: number
  basePoints: number
  breakdown: string
  title: string
  reasoning: string
}

export interface VaultQuote {
  cost: number
  tag: string
  usd: number
  hrs: number
}

export interface BountyDraft {
  id?: string
  title: string
  category: VaultCategory
  usd: number
  hrs: number
}

export interface DecayAlert {
  earned: number
}
