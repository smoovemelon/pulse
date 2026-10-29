import { describe, expect, it } from 'vitest'
import { avatarFrame } from '../avatar'

describe('avatar frame', () => {
  it('starts centered and keeps the circle covered', () => {
    const frame = avatarFrame(800, 400, 224, 1, 0, 0)
    expect(frame.width).toBeGreaterThanOrEqual(224)
    expect(frame.height).toBeGreaterThanOrEqual(224)
    expect(frame.x).toBe(0)
    expect(frame.y).toBe(0)
  })

  it('stops a drag at the edge of the picture', () => {
    const frame = avatarFrame(800, 400, 224, 1, 500, -500)
    expect(frame.x).toBeCloseTo(112)
    expect(frame.y).toBeCloseTo(0)
    expect(frame.width / 2 - frame.x).toBeCloseTo(112)
  })

  it('lets a closer zoom move farther', () => {
    const wide = avatarFrame(800, 400, 224, 1, 999, 999)
    const close = avatarFrame(800, 400, 224, 2, 999, 999)
    expect(close.x).toBeGreaterThan(wide.x)
    expect(wide.y).toBeCloseTo(0)
    expect(close.y).toBeGreaterThan(0)
  })
})