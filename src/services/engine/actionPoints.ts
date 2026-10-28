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

const CRUISER_FLOOR = 7
const HEAVY_FLOOR = 8
const OFF_ANCHOR_MULTIPLIER = 0.5

function sessionTitle(rawAction: string, duration: number): string {
  const cleaned = rawAction.trim().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '')
  if (!cleaned) {
    const minutes = Math.max(5, Math.min(360, Math.round(Number(duration) || 45)))
    return `${minutes}-Min Logged Session`
  }
  return cleaned.length > 42 ? `${cleaned.slice(0, 41).trimEnd()}…` : cleaned
}

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
  if (input.valid && specific && reported >= CRUISER_FLOOR) {
    const scored = reported >= HEAVY_FLOOR ? reported : Math.max(reported, CRUISER_FLOOR)
    return calculateActionPoints(input.strain, scored, input.duration, input.title, input.raw, input.reasoning)
  }

  if (input.valid && specific) {
    const base = calculateActionPoints(input.strain, 1, input.duration, input.title, input.raw, input.reasoning)
    return {
      ...base,
      alignment: reported,
      multiplier: 1,
      weightClass: 'Middleweight (1.0x)',
      partial: false,
      points: Math.max(5, base.basePoints),
      breakdown: `Base: ${base.basePoints} (Strain ${base.strain.toFixed(1)} @ ${base.duration}m) × 1x (Middleweight)`,
      reasoning: input.reasoning,
    }
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
  const note = message && message.length < 80 ? ` ${message}` : ''
  return evaluateAnchorAction({
    strain: 6,
    alignment: 3,
    valid: false,
    duration,
    title: sessionTitle(rawAction, duration),
    raw: rawAction,
    reasoning: '',
    rejectionReason: `Scored without an anchor check, so this stays at half credit.${note}`,
  })
}
