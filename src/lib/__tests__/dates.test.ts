import { describe, expect, it } from 'vitest'
import { formatHistoryTime } from '../dates'

describe('history time', () => {
  const now = new Date(2026, 10, 4, 16, 0)

  it('formats a real timestamp and labels a display string from its date', () => {
    const morning = new Date(2026, 10, 4, 9, 0).toISOString()
    expect(formatHistoryTime(morning, '2026-11-04', now)).toBe('Today, 9:00 AM')
    expect(formatHistoryTime('Today, 9:00 AM', '2026-10-21', now)).toBe(
      new Date(2026, 9, 21).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    )
    expect(formatHistoryTime('2 days ago, 6:00 PM', '2026-11-04', now)).toBe('Today')
  })
})