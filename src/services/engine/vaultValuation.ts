import type { EconomyConfig, EconomyDifficulty, PulseState, VaultCategory, VaultItem, VaultMeasurement, VaultQuote, VaultValidation } from '../../types'

export function economyPreset(difficulty: EconomyDifficulty): EconomyConfig {
  if (difficulty === 'lenient') return { difficulty, timeMultiplier: 80, cashMultiplier: 12 }
  if (difficulty === 'hardcore') return { difficulty, timeMultiplier: 160, cashMultiplier: 30 }
  return { difficulty: 'balanced', timeMultiplier: 120, cashMultiplier: 20 }
}

export const BALANCED_ECONOMY = economyPreset('balanced')

export function canonicalVaultCategory(value: string): VaultCategory | null {
  if (value === 'gaming' || value === 'streaming' || value === 'social' || value === 'Gaming') return 'gaming'
  if (value === 'food' || value === 'dining' || value === 'Dining') return 'food'
  if (value === 'items' || value === 'gear' || value === 'custom' || value === 'Items') return 'items'
  if (value === 'events' || value === 'outings' || value === 'Events') return 'events'
  return null
}

export function measurementFor(category: string): VaultMeasurement {
  return canonicalVaultCategory(category) === 'gaming' ? 'time' : 'money'
}

export function applyDifficulty(
  state: PulseState,
  difficulty: EconomyDifficulty,
): { readonly ok: true; readonly state: PulseState } | { readonly ok: false } {
  if (state.economy.difficulty === difficulty) return { ok: true, state }
  if (state.difficultyLocked) return { ok: false }
  const economy = economyPreset(difficulty)
  return {
    ok: true,
    state: {
      ...state,
      difficultyLocked: true,
      economy,
      vaultItems: repriceVault(state.vaultItems, economy),
    },
  }
}

export function calculateVaultValuation(measurement: VaultMeasurement, amountRaw: number, config: EconomyConfig = BALANCED_ECONOMY): VaultQuote {
  const amount = Math.max(0, Number(amountRaw) || 0)
  if (measurement === 'time') {
    const cost = Math.round((amount / 60) * config.timeMultiplier)
    return {
      cost,
      tag: `${amount} min @ ${config.timeMultiplier} PTS/hr`,
      usd: 0,
      hrs: amount / 60,
    }
  }
  const cost = Math.round(amount * config.cashMultiplier)
  return {
    cost,
    tag: `$${amount} @ ${config.cashMultiplier} PTS/$`,
    usd: amount,
    hrs: 0,
  }
}

export function validateVaultDraft(measurement: VaultMeasurement, amountRaw: number): VaultValidation {
  const amount = Math.max(0, Number(amountRaw) || 0)
  if (measurement === 'time') {
    if (amount <= 0) return { ok: false, message: 'Enter a duration in minutes.' }
    return { ok: true }
  }
  if (amount <= 0) return { ok: false, message: 'Enter a price in dollars.' }
  return { ok: true }
}

export function vaultTag(item: Pick<VaultItem, 'measurementType' | 'durationMinutes' | 'priceDollars'>, config: EconomyConfig): string {
  return calculateVaultValuation(
    item.measurementType,
    item.measurementType === 'time' ? item.durationMinutes ?? 0 : item.priceDollars ?? 0,
    config,
  ).tag
}

export function repriceVault(items: readonly VaultItem[], config: EconomyConfig): readonly VaultItem[] {
  return items.map((item) => {
    const amount = item.measurementType === 'time' ? item.durationMinutes ?? 0 : item.priceDollars ?? 0
    return { ...item, baseCost: calculateVaultValuation(item.measurementType, amount, config).cost }
  })
}

export function migrateLegacyVault(category: string, cost: number, id: string, title: string): VaultItem | null {
  const createdAt = new Date().toISOString()
  if (category === 'Gaming') {
    const durationMinutes = Math.round((cost / 120) * 60)
    const baseCost = calculateVaultValuation('time', durationMinutes, BALANCED_ECONOMY).cost
    return { id, title, category: 'gaming', measurementType: 'time', durationMinutes, priceDollars: 0, baseCost, createdAt }
  }
  if (category === 'Items' || category === 'Dining' || category === 'Events') {
    const priceDollars = Math.round(cost / 20)
    const mapped = canonicalVaultCategory(category) ?? 'items'
    const baseCost = calculateVaultValuation('money', priceDollars, BALANCED_ECONOMY).cost
    return { id, title, category: mapped, measurementType: 'money', durationMinutes: 0, priceDollars, baseCost, createdAt }
  }
  return null
}
