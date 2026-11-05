import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  elapsedToDuration,
  formatElapsed,
  pauseSessionTimer,
  readSessionTimer,
  resetSessionTimer,
  restoreSessionTimer,
  startSessionTimer,
} from '../sessionTimer'

describe('session timer', () => {
  afterEach(() => {
    resetSessionTimer()
  })

  it('formats and clamps elapsed time for scoring', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(65_000)).toBe('01:05')
    expect(formatElapsed(3_661_000)).toBe('1:01:01')
    expect(elapsedToDuration(0)).toBe(5)
    expect(elapsedToDuration(4 * 60_000)).toBe(5)
    expect(elapsedToDuration(47 * 60_000)).toBe(47)
    expect(elapsedToDuration(400 * 60_000)).toBe(360)
  })

  it('continues a stored session after a reload', () => {
    const memory = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    })
    startSessionTimer(1_000)
    restoreSessionTimer()
    expect(readSessionTimer(61_000)).toEqual({ running: true, elapsedMs: 60_000 })
    pauseSessionTimer(61_000)
    restoreSessionTimer()
    expect(readSessionTimer(90_000)).toEqual({ running: false, elapsedMs: 60_000 })
    resetSessionTimer()
    expect(memory.has('pulse_session_timer')).toBe(false)
    vi.unstubAllGlobals()
  })

  it('accumulates across pause and resume', () => {
    startSessionTimer(1_000)
    pauseSessionTimer(61_000)
    expect(readSessionTimer(61_000)).toEqual({ running: false, elapsedMs: 60_000 })
    startSessionTimer(100_000)
    expect(readSessionTimer(130_000)).toEqual({ running: true, elapsedMs: 90_000 })
  })
})
