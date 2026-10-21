export function dayPart(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 5 && hour <= 11) return 'morning'
  if (hour >= 12 && hour <= 16) return 'afternoon'
  return 'evening'
}

export function greetingLine(hour: number, username: string): string {
  const part = dayPart(hour)
  const name = username.trim().toLowerCase()
  return name ? `good ${part}, ${name}.` : `good ${part}.`
}

export function greetingDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const day = String(date.getDate()).padStart(2, '0')
  return `${weekday}, ${day} ${month}.`
}
