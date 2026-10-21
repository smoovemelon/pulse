export type TxType = 'EARN' | 'SPEND'
export type FeedFilter = 'ALL' | 'HEAVY' | 'ALIGNED' | 'SPEND'
export type VaultCategory = 'Gaming' | 'Items' | 'Dining' | 'Events'
export type VaultFilter = 'ALL' | VaultCategory
export type SpendCategory = VaultCategory | 'Decay Audit'
export type WeightClass = 'Heavyweight (2.0x)' | 'Cruiserweight (1.5x)' | 'Middleweight (1.0x)'
export type ThemeName = 'light' | 'dark'
export type FeedbackKind = 'click' | 'earn' | 'spend' | 'error'

interface TransactionBase {
  readonly id: string
  readonly title: string
  readonly points: number
  readonly timestamp: string
  readonly date: string
  readonly reasoning?: string
  readonly formula_breakdown?: string
}

export interface EarnTransaction extends TransactionBase {
  readonly type: 'EARN'
  readonly effort_strain?: number
  readonly anchor_alignment?: number
  readonly multiplier?: number
  readonly weight_class?: WeightClass
  readonly category?: VaultCategory
}

export interface SpendTransaction extends TransactionBase {
  readonly type: 'SPEND'
  readonly category?: SpendCategory
  readonly effort_strain?: number
  readonly anchor_alignment?: number
  readonly multiplier?: number
  readonly weight_class?: WeightClass
}

export type Transaction = EarnTransaction | SpendTransaction

export interface VaultItem {
  readonly id: string
  readonly title: string
  readonly cost: number
  readonly category: VaultCategory
  readonly usd: number
  readonly hrs: number
  readonly formulaTag: string
}

export interface PulseState {
  readonly balance: number
  readonly soundEnabled: boolean
  readonly decayEnabled: boolean
  readonly lastAuditDate: string
  readonly apiKey: string
  readonly disciplineAnchor: string
  readonly dailyGoal: number
  readonly theme: ThemeName
  readonly transactions: readonly Transaction[]
  readonly vaultItems: readonly VaultItem[]
}

export interface ActionScore {
  readonly points: number
  readonly strain: number
  readonly alignment: number
  readonly multiplier: number
  readonly weightClass: WeightClass
  readonly duration: number
  readonly basePoints: number
  readonly breakdown: string
  readonly title: string
  readonly reasoning: string
}

export interface VaultQuote {
  readonly cost: number
  readonly tag: string
  readonly usd: number
  readonly hrs: number
}

export interface BountyDraft {
  readonly id?: string
  readonly title: string
  readonly category: VaultCategory
  readonly usd: number
  readonly hrs: number
}

export interface EarnDraft {
  readonly title: string
  readonly points: number
  readonly effort_strain?: number
  readonly anchor_alignment?: number
  readonly multiplier?: number
  readonly weight_class?: WeightClass
  readonly formula_breakdown?: string
  readonly reasoning?: string
}

export interface DecayAlert {
  readonly earned: number
}

export interface LifetimeStats {
  readonly earned: number
  readonly spent: number
}

export type VaultValidation = { readonly ok: true } | { readonly ok: false; readonly message: string }
