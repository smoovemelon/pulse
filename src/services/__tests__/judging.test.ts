import { describe, expect, it } from 'vitest'
import { isNamedAnchor } from '../../lib/dates'
import { scoreJudgment } from '../engine/judging'
import type { JudgeWeight, Relevance, StrainBand } from '../../types'

const STRAIN = { HIGH: 60, MEDIUM: 40, LOW: 20 } as const
const RELEVANCE = { DIRECT: 1, ENABLING: 0.75, GENERAL: 0.5 } as const
const WEIGHT = { HEAVYWEIGHT: 2, CRUISERWEIGHT: 1.5, LIGHTWEIGHT: 1 } as const

describe('judging', () => {
  it('scores every strain, relevance, and weight pair in code', () => {
    const strains = Object.keys(STRAIN) as StrainBand[]
    const relevances = Object.keys(RELEVANCE) as Relevance[]
    const weights = Object.keys(WEIGHT) as JudgeWeight[]
    expect(strains.length * relevances.length * weights.length).toBe(27)

    for (const strain of strains) {
      for (const relevance of relevances) {
        for (const weightClass of weights) {
          const scored = scoreJudgment(
            { strain, relevance, weightClass, reasoning: 'Checked.' },
            'Session',
          )
          expect(scored.points).toBe(Math.round(STRAIN[strain] * RELEVANCE[relevance] * WEIGHT[weightClass]))
          expect(scored.multiplier).toBe(WEIGHT[weightClass])
          expect(scored.duration).toBe(45)
        }
      }
    }
  })

  it('pays a longer logged session more and still applies the weight', () => {
    const ratings = { strain: 'MEDIUM' as const, relevance: 'DIRECT' as const, weightClass: 'LIGHTWEIGHT' as const, reasoning: 'Checked.' }
    const short = scoreJudgment(ratings, 'Session', 15)
    const baseline = scoreJudgment(ratings, 'Session', 45)
    const long = scoreJudgment(ratings, 'Session', 90)
    expect(long.points).toBeGreaterThan(baseline.points)
    expect(baseline.points).toBeGreaterThan(short.points)
    const heavyShort = scoreJudgment({ ...ratings, weightClass: 'HEAVYWEIGHT' }, 'Session', 15)
    const lightLong = scoreJudgment({ ...ratings, relevance: 'GENERAL', weightClass: 'LIGHTWEIGHT' }, 'Session', 90)
    expect(heavyShort.points).toBeGreaterThan(lightLong.points)
  })

  it('rejects an empty anchor and the default placeholder', () => {
    expect(isNamedAnchor('')).toBe(false)
    expect(isNamedAnchor('   ')).toBe(false)
    expect(isNamedAnchor('Your main goal')).toBe(false)
    expect(isNamedAnchor('Ship the lab')).toBe(true)
  })
})
