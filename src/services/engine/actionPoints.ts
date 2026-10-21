import type { ActionScore, WeightClass } from '../../types'

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
  let weightClass: WeightClass = 'Middleweight (1.0x)'
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
