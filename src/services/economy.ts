import type { ActionScore, Transaction, VaultCategory, VaultQuote } from '../types'

export function earnedOn(transactions: Transaction[], checkDate: string): number {
  return transactions
    .filter(
      (tx) =>
        tx.type === 'EARN' &&
        (tx.date === checkDate || (!tx.date && Boolean(tx.timestamp?.includes('Today')))),
    )
    .reduce((sum, tx) => sum + (Number(tx.points) || 0), 0)
}

export function calculateActionPoints(
  strainRaw: number,
  alignmentRaw: number,
  durationMinutes: number,
  polishedTitle: string,
  rawInput: string,
  reasoning: string,
): ActionScore {
  const strain = Math.max(1, Math.min(10, Number(strainRaw) || 6))
  const alignment = Math.max(1, Math.min(10, Number(alignmentRaw) || 5))
  const duration = Math.max(5, Math.min(360, Number(durationMinutes) || 45))
  const durationFactor = Math.pow(duration / 45, 0.45)
  const basePoints = Math.round(strain * 8 * durationFactor)

  let multiplier = 1
  let weightClass = 'Middleweight (1.0x)'
  if (alignment >= 8) {
    multiplier = 2
    weightClass = 'Heavyweight (2.0x)'
  } else if (alignment >= 4) {
    multiplier = 1.5
    weightClass = 'Cruiserweight (1.5x)'
  }

  const points = Math.max(5, Math.round(basePoints * multiplier))
  let title = (polishedTitle || rawInput || 'Workout Session').trim().replace(/^["']|["']$/g, '')
  title = title.replace(/^(completed|finished|did|worked on)\s+/i, '')
  const breakdown = `Base: ${basePoints} (Strain ${strain.toFixed(1)} @ ${duration}m) × ${multiplier}x (${weightClass.split(' ')[0]})`

  return {
    points,
    strain,
    alignment,
    multiplier,
    weightClass,
    duration,
    basePoints,
    breakdown,
    title,
    reasoning,
  }
}

export function localActionFallback(rawAction: string, duration: number, message: string): ActionScore {
  const formattedTitle = rawAction.toLowerCase().includes('push')
    ? `${duration}-Min Push Session w/ Brandon`
    : `${duration}-Min ${rawAction.charAt(0).toUpperCase()}${rawAction.slice(1)}`
  return calculateActionPoints(
    7,
    7.5,
    duration,
    formattedTitle,
    rawAction,
    `Local assessment: ${message || 'Heuristic calibration'}`,
  )
}

export function quoteVault(category: VaultCategory, usdRaw: number, hrsRaw: number): VaultQuote {
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

export type VaultValidation = { ok: true } | { ok: false; message: string }

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
