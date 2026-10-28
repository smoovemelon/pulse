import type { ActionJudgmentResult, JudgeWeight, Relevance, StrainBand, WeightClass } from '../../types'

const STRAIN_POINTS = { HIGH: 60, MEDIUM: 40, LOW: 20 } as const
const RELEVANCE_MULT = { DIRECT: 1, ENABLING: 0.75, GENERAL: 0.5 } as const
const WEIGHT_MULT = { HEAVYWEIGHT: 2, CRUISERWEIGHT: 1.5, LIGHTWEIGHT: 1 } as const

const STRAINS = new Set<StrainBand>(['HIGH', 'MEDIUM', 'LOW'])
const RELEVANCE = new Set<Relevance>(['DIRECT', 'ENABLING', 'GENERAL'])
const WEIGHTS = new Set<JudgeWeight>(['HEAVYWEIGHT', 'CRUISERWEIGHT', 'LIGHTWEIGHT'])

export function coerceJudgment(value: Partial<ActionJudgmentResult> | null | undefined): ActionJudgmentResult {
  return {
    relevance: value?.relevance && RELEVANCE.has(value.relevance) ? value.relevance : 'GENERAL',
    strain: value?.strain && STRAINS.has(value.strain) ? value.strain : 'MEDIUM',
    weightClass: value?.weightClass && WEIGHTS.has(value.weightClass) ? value.weightClass : 'LIGHTWEIGHT',
    reasoning: typeof value?.reasoning === 'string' && value.reasoning.trim() ? value.reasoning.trim() : 'Scored from the anchor rubric.',
  }
}

export function offlineJudgment(note = ''): ActionJudgmentResult {
  const extra = note.trim() ? ` ${note.trim()}` : ''
  return {
    relevance: 'GENERAL',
    strain: 'MEDIUM',
    weightClass: 'LIGHTWEIGHT',
    reasoning: `Scored on device without an anchor check.${extra}`,
  }
}

export function weightClassLabel(weight: JudgeWeight): WeightClass {
  if (weight === 'HEAVYWEIGHT') return 'Heavyweight (2.0x)'
  if (weight === 'CRUISERWEIGHT') return 'Cruiserweight (1.5x)'
  return 'Lightweight (1.0x)'
}

export function scoreJudgment(result: ActionJudgmentResult, title: string) {
  const judged = coerceJudgment(result)
  const base = STRAIN_POINTS[judged.strain]
  const relevance = RELEVANCE_MULT[judged.relevance]
  const weight = WEIGHT_MULT[judged.weightClass]
  const points = Math.round(base * relevance * weight)
  return {
    points,
    strain: judged.strain === 'HIGH' ? 8 : judged.strain === 'MEDIUM' ? 5 : 3,
    alignment: judged.relevance === 'DIRECT' ? 9 : judged.relevance === 'ENABLING' ? 6 : 3,
    multiplier: weight,
    weightClass: weightClassLabel(judged.weightClass),
    judgeWeight: judged.weightClass,
    duration: 0,
    basePoints: base,
    breakdown: `${base} × ${relevance} × ${weight} (${judged.strain} ${judged.relevance} ${judged.weightClass})`,
    title: title.trim().slice(0, 60) || 'Logged session',
    reasoning: judged.reasoning,
    partial: judged.relevance !== 'DIRECT',
  }
}
