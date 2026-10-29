export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function localDateKey(date = new Date()): string {
  const formatted = date.toLocaleDateString('en-CA')
  if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function shiftDateKey(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const cursor = new Date(year, month - 1, day)
  cursor.setDate(cursor.getDate() + days)
  return localDateKey(cursor)
}

export function localNoonIso(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0).toISOString()
}

export function formatTimestamp(value: string, now = new Date()): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  const date = new Date(parsed)
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (localDateKey(date) === localDateKey(now)) {
    const age = now.getTime() - date.getTime()
    if (age >= 0 && age < 60_000) return 'Today, Just now'
    return `Today, ${time}`
  }
  const when = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${when}, ${time}`
}

export const DAILY_GOAL = 120
export const DEFAULT_ANCHOR = 'Your main goal'

export function isNamedAnchor(anchor: string): boolean {
  const trimmed = anchor.trim()
  return trimmed !== '' && trimmed !== DEFAULT_ANCHOR
}
