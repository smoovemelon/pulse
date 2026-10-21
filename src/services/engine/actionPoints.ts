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
    partial: false,
  }
}

const ANCHOR_QUALIFY = 7
const OFF_ANCHOR_MULTIPLIER = 0.5

function lacksConcreteProof(text: string): boolean {
  const trimmed = text.trim()
  if (/\d/.test(trimmed)) return false
  return !/\b(reps?|sets?|pages?|chapters?|miles?|kms?|lbs?|kgs?|pounds?|kilos?|problems?|assignments?|essays?|exams?|projects?|laps?|rounds?|slides?|words?|bench|squat|deadlift|notes?|library|practice|lecture|homework|labs?|push|pull|legs|cardio|runs?|swims?|classes?|readings?|papers?)\b/i.test(
    trimmed,
  )
}

export function evaluateAnchorAction(input: {
  readonly strain: number
  readonly alignment: number
  readonly valid: boolean
  readonly duration: number
  readonly title: string
  readonly raw: string
  readonly reasoning: string
  readonly rejectionReason?: string
}): ActionScore {
  const reported = Math.max(0, Math.min(10, Number(input.alignment) || 0))
  const specific = !lacksConcreteProof(input.raw)
  const full = input.valid && specific && reported >= ANCHOR_QUALIFY
  if (full) {
    return calculateActionPoints(input.strain, reported, input.duration, input.title, input.raw, input.reasoning)
  }

  const critique =
    input.rejectionReason?.trim() ||
    (!specific
      ? 'Name a count, a weight, a distance, or a finished result to earn more than half credit.'
      : 'This is productive, but it does not directly move the anchor, so it earns half credit.')
  const base = calculateActionPoints(input.strain, 1, input.duration, input.title, input.raw, critique)
  const points = Math.max(5, Math.round(base.basePoints * OFF_ANCHOR_MULTIPLIER))
  return {
    ...base,
    points,
    alignment: Math.max(1, Math.min(3.9, reported || 1)),
    multiplier: OFF_ANCHOR_MULTIPLIER,
    weightClass: 'Lightweight (0.5x)',
    partial: true,
    breakdown: `Base: ${base.basePoints} (Strain ${base.strain.toFixed(1)} @ ${base.duration}m) × 0.5x (Lightweight)`,
    reasoning: critique,
  }
}

export function localActionFallback(rawAction: string, duration: number, message: string): ActionScore {
  const formattedTitle = rawAction.toLowerCase().includes('push')
    ? `${duration}-Min Push Session w/ Brandon`
    : `${duration}-Min ${rawAction.charAt(0).toUpperCase()}${rawAction.slice(1)}`
  return evaluateAnchorAction({
    strain: 7,
    alignment: 3,
    valid: false,
    duration,
    title: formattedTitle,
    raw: rawAction,
    reasoning: '',
    rejectionReason: message && message.length < 80
      ? `Scored without an anchor check, so this stays at half credit. ${message}`
      : 'Scored without an anchor check, so this stays at half credit.',
  })
}
