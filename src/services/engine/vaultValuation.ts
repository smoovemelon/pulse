import type { VaultCategory, VaultQuote, VaultValidation } from '../../types'

export function calculateVaultValuation(category: VaultCategory, usdRaw: number, hrsRaw: number): VaultQuote {
  const usd = Math.max(0, Number(usdRaw) || 0)
  const hrs = Math.max(0, Number(hrsRaw) || 0)

  if (category === 'Gaming') {
    const cost = Math.max(0, Math.round(hrs * 50))
    return {
      cost,
      tag: hrs > 0 ? `${hrs} hrs @ 50 PTS/hr` : 'Enter hours',
      usd: 0,
      hrs,
    }
  }

  if (category === 'Items') {
    const cost = Math.max(0, Math.round(usd * 20))
    return {
      cost,
      tag: usd > 0 ? `$${usd} @ 20 PTS/$` : 'Enter price',
      usd,
      hrs: 0,
    }
  }

  if (hrs > 0 && usd > 0) {
    return {
      cost: Math.max(25, Math.round(usd * 20 + hrs * 35)),
      tag: `$${usd} + ${hrs} hrs`,
      usd,
      hrs,
    }
  }

  if (hrs > 0) {
    return {
      cost: Math.max(25, Math.round(hrs * 50)),
      tag: `${hrs} hrs @ 50 PTS/hr`,
      usd: 0,
      hrs,
    }
  }

  return { cost: 0, tag: 'Time required', usd, hrs: 0 }
}

export function validateVaultDraft(category: VaultCategory, usdRaw: number, hrsRaw: number): VaultValidation {
  const usd = Math.max(0, Number(usdRaw) || 0)
  const hrs = Math.max(0, Number(hrsRaw) || 0)

  if (category === 'Gaming') {
    if (usd > 0) return { ok: false, message: 'Gaming is time-only. Price must stay at $0.' }
    if (hrs <= 0) return { ok: false, message: 'Please specify a duration (hours) for Gaming' }
    return { ok: true }
  }

  if (category === 'Items') {
    if (hrs > 0) return { ok: false, message: 'Items are price-only. Duration must stay at 0 hours.' }
    if (usd <= 0) return { ok: false, message: 'Please specify a price (USD $) for Items' }
    return { ok: true }
  }

  if (hrs <= 0) return { ok: false, message: `Please specify a duration (hours) for ${category}` }
  return { ok: true }
}
