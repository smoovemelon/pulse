import { describe, expect, it } from 'vitest'
import { chargeCost, discountRate } from '../engine/pacing'
import { calculateVaultValuation, economyPreset, migrateLegacyVault } from '../engine/vaultValuation'

describe('vault economy', () => {
  it('prices time and money on each dial', () => {
    expect(calculateVaultValuation('time', 60, economyPreset('lenient')).cost).toBe(80)
    expect(calculateVaultValuation('money', 5, economyPreset('lenient')).cost).toBe(60)
    expect(calculateVaultValuation('time', 60, economyPreset('balanced')).cost).toBe(120)
    expect(calculateVaultValuation('money', 5, economyPreset('balanced')).cost).toBe(100)
    expect(calculateVaultValuation('time', 60, economyPreset('hardcore')).cost).toBe(160)
    expect(calculateVaultValuation('money', 5, economyPreset('hardcore')).cost).toBe(150)
  })

  it('discounts from the weaker streak and freezes while a warning is open', () => {
    const quiet = { chainStreak: 14, forgeStreak: 30, discountFrozenUntil: '' }
    expect(discountRate(quiet)).toBe(0.15)
    expect(chargeCost(quiet, 100)).toBe(85)
    expect(discountRate({ chainStreak: 7, forgeStreak: 7, discountFrozenUntil: '' })).toBe(0.1)
    expect(discountRate({ chainStreak: 30, forgeStreak: 30, discountFrozenUntil: '' })).toBe(0.2)
    const warned = { ...quiet, warnings: ['deck1'] as const }
    expect(discountRate(warned)).toBe(0)
    expect(chargeCost(warned, 100)).toBe(100)
  })

  it('maps retired bounty rows onto time and money', () => {
    expect(migrateLegacyVault('streaming', 120, 's', 'Queue')).toMatchObject({
      category: 'gaming',
      measurementType: 'time',
      durationMinutes: 60,
      baseCost: 120,
    })
    expect(migrateLegacyVault('Dining', 40, 'd', 'Lunch')).toMatchObject({
      category: 'food',
      measurementType: 'money',
      priceDollars: 2,
      baseCost: 40,
    })
    expect(migrateLegacyVault('gear', 100, 'g', 'Mug')).toMatchObject({
      category: 'items',
      measurementType: 'money',
      priceDollars: 5,
      baseCost: 100,
    })
    expect(migrateLegacyVault('outings', 80, 'o', 'Show')).toMatchObject({
      category: 'events',
      measurementType: 'money',
      priceDollars: 4,
      baseCost: 80,
    })
    expect(migrateLegacyVault('flat', 50, 'f', 'Pass')).toBeNull()
  })
})