import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PulseState } from '../../types'
import { freshState, loadState, restoreStorageBackup, saveState, serializeBackup } from '../persistence'

function memoryStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    get length() {
      return store.size
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
  })
}

function sample(): PulseState {
  return {
    ...freshState(),
    balance: 315,
    disciplineAnchor: 'Finish the problem set',
    streakCount: 4,
    streakState: 'SAFE',
    username: 'melon',
    isOnboarded: true,
    transactions: [
      {
        id: 'earn-1',
        type: 'EARN',
        title: 'Problem set block',
        points: 40,
        timestamp: 'Today',
        date: '2026-10-21',
      },
    ],
  }
}

describe('storage backup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips ledger keys through altius-backup.json', () => {
    memoryStorage()
    const state = sample()
    saveState(state)
    localStorage.setItem('pulse_profile', 'fresh-1')
    localStorage.setItem('pulse_intro', 'seen')

    const file = JSON.parse(serializeBackup(state)) as { storage: Record<string, string> }
    expect(file.storage.pulse_balance).toBe('315')
    expect(file.storage.pulse_username).toBe('melon')
    expect(file.storage.pulse_streak_count).toBe('4')
    expect(file.storage.pulse_intro).toBe('seen')

    localStorage.setItem('pulse_balance', '0')
    localStorage.setItem('pulse_username', '')
    const restored = restoreStorageBackup(file)
    expect(restored?.balance).toBe(315)
    expect(restored?.username).toBe('melon')
    expect(restored?.streakCount).toBe(4)
    expect(restored?.transactions).toHaveLength(1)
    expect(localStorage.getItem('pulse_intro')).toBe('seen')
    expect(localStorage.getItem('pulse_profile')).toBe('fresh-1')
  })

  it('rejects a backup that is missing schema keys and leaves storage alone', () => {
    memoryStorage()
    saveState(sample())
    localStorage.setItem('pulse_profile', 'fresh-1')

    expect(() => restoreStorageBackup({ storage: { pulse_balance: '1' } })).toThrow('Invalid backup JSON file')
    expect(localStorage.getItem('pulse_balance')).toBe('315')
    expect(localStorage.getItem('pulse_username')).toBe('melon')
  })

  it('keeps an existing ledger when the profile tag is old', () => {
    memoryStorage()
    saveState(sample())
    localStorage.setItem('pulse_profile', 'legacy')

    const loaded = loadState()

    expect(loaded.balance).toBe(315)
    expect(loaded.username).toBe('melon')
    expect(loaded.transactions).toHaveLength(1)
    expect(localStorage.getItem('pulse_profile')).toBe('fresh-1')
  })
})
