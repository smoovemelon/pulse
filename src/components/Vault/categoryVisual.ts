export function categoryVisual(catName = '') {
  const name = catName.toLowerCase()
  if (name.includes('game') || name.includes('stream') || name.includes('valorant')) {
    return {
      kind: 'gaming' as const,
      chip: 'chip-violet',
      tag: 'Gaming (Time)',
    }
  }
  if (
    name.includes('item') ||
    name.includes('gear') ||
    name.includes('social') ||
    name.includes('custom') ||
    name.includes('hard') ||
    name.includes('tech') ||
    name.includes('chassis') ||
    name.includes('phone')
  ) {
    return {
      kind: 'items' as const,
      chip: 'chip-sky',
      tag: 'Items (Price)',
    }
  }
  if (name.includes('din') || name.includes('food') || name.includes('bbq') || name.includes('meal')) {
    return {
      kind: 'dining' as const,
      chip: 'chip-amber',
      tag: 'Dining (Time+)',
    }
  }
  if (name.includes('event') || name.includes('outing') || name.includes('ticket') || name.includes('concert')) {
    return {
      kind: 'events' as const,
      chip: 'chip-emerald',
      tag: 'Events (Time+)',
    }
  }
  return {
    kind: 'items' as const,
    chip: 'chip-zinc',
    tag: 'Items',
  }
}
