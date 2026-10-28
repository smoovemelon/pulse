export type TxType = 'EARN' | 'SPEND'
export type FeedFilter = 'ALL' | 'HEAVY' | 'ALIGNED' | 'SPEND'
export type VaultCategory = 'gaming' | 'food' | 'items' | 'events'
export type RetiredVaultCategory = 'streaming' | 'social' | 'dining' | 'gear' | 'outings' | 'custom'
export type LegacySpendCategory = 'Gaming' | 'Items' | 'Dining' | 'Events'
export type VaultMeasurement = 'time' | 'money'
export type VaultFilter = 'ALL' | VaultCategory
export type SpendCategory = VaultCategory | RetiredVaultCategory | LegacySpendCategory | 'Decay Audit'
export type EconomyDifficulty = 'lenient' | 'balanced' | 'hardcore'
export interface EconomyConfig {
  readonly difficulty: EconomyDifficulty
  readonly timeMultiplier: number
  readonly cashMultiplier: number
}
export type WeightClass = 'Heavyweight (2.0x)' | 'Cruiserweight (1.5x)' | 'Middleweight (1.0x)' | 'Lightweight (1.0x)' | 'Lightweight (0.5x)'
export type Relevance = 'DIRECT' | 'ENABLING' | 'GENERAL'
export type StrainBand = 'HIGH' | 'MEDIUM' | 'LOW'
export type JudgeWeight = 'HEAVYWEIGHT' | 'CRUISERWEIGHT' | 'LIGHTWEIGHT'
export type WarningId = 'deck1' | 'deck2' | 'deck3'
export type ThemeName = 'light' | 'dark'
export type StreakState = 'STALLED' | 'SAFE' | 'SECURED'
export type WeekMark = 'secured' | 'grace' | 'missed' | 'quiet' | 'today' | 'upcoming'
export type FeedbackKind = 'click' | 'earn' | 'spend' | 'error'

interface TransactionBase {
  readonly id: string
  readonly title: string
  readonly points: number
  readonly timestamp: string
  readonly date: string
  readonly reasoning?: string
  readonly formula_breakdown?: string
  readonly is_locked?: boolean
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
  readonly category: VaultCategory
  readonly measurementType: VaultMeasurement
  readonly durationMinutes?: number
  readonly priceDollars?: number
  readonly baseCost: number
  readonly createdAt: string
}

export interface PulseState {
  readonly balance: number
  readonly soundEnabled: boolean
  readonly lastAuditDate: string
  readonly apiKey: string
  readonly disciplineAnchor: string
  readonly dailyGoal: number
  readonly theme: ThemeName
  readonly demoMode: boolean
  readonly streakCount: number
  readonly forgeStreak: number
  readonly lastChainCompletedDate: string
  readonly lastForgeCompletedDate: string
  readonly economy: EconomyConfig
  readonly difficultyLocked: boolean
  readonly streakState: StreakState
  readonly username: string
  readonly isOnboarded: boolean
  readonly transactions: readonly Transaction[]
  readonly vaultItems: readonly VaultItem[]
  readonly decks: readonly HabitDeck[]
  readonly habitDay: HabitDay
  readonly pacing: PacingScheduleConfig
  readonly warnings: readonly WarningId[]
  readonly ptoTokens: number
  readonly ptoCadence: number
  readonly chainStreak: number
  readonly discountFrozenUntil: string
  readonly habitsNeedScore: boolean
}

export interface MicroHabit {
  readonly id: string
  readonly title: string
  readonly points: number
  readonly relevance: Relevance
  readonly strain: StrainBand
}

export interface HabitDeck {
  readonly id: string
  readonly name: string
  readonly habits: readonly MicroHabit[]
}

export interface HabitDay {
  readonly date: string
  readonly completedIds: readonly string[]
  readonly clearedWarnings: readonly WarningId[]
  readonly shielded: boolean
}

export interface PacingScheduleConfig {
  readonly deck1Cutoff: string
  readonly deck2Cutoff: string
  readonly auditCutoff: string
  readonly lastModified: string
  readonly pendingConfig?: {
    readonly deck1Cutoff: string
    readonly deck2Cutoff: string
    readonly effectiveDate: string
  }
}

export interface ActionJudgmentResult {
  readonly relevance: Relevance
  readonly strain: StrainBand
  readonly weightClass: JudgeWeight
  readonly reasoning: string
}

export interface WeekDay {
  readonly date: string
  readonly label: string
  readonly mark: WeekMark
  readonly earned: number
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
  readonly partial: boolean
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
  readonly measurementType: VaultMeasurement
  readonly amount: number
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

export interface SpendDraft {
  readonly title: string
  readonly category: VaultCategory
  readonly measurementType: VaultMeasurement
  readonly amount: number
}

export interface DecayAlert {
  readonly earned: number
  readonly penalty: number
  readonly target: number
}

export interface LifetimeStats {
  readonly earned: number
  readonly spent: number
}

export type VaultValidation = { readonly ok: true } | { readonly ok: false; readonly message: string }
