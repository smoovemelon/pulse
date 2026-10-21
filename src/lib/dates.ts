export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export const DAILY_GOAL = 120
export const DECAY_PENALTY = 15
export const DEFAULT_ANCHOR = 'Your main goal'

export function isNamedAnchor(anchor: string): boolean {
  const trimmed = anchor.trim()
  return trimmed !== '' && trimmed !== DEFAULT_ANCHOR
}
