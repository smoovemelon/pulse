export function categoryVisual(catName = '') {
  const name = catName.toLowerCase()
  if (name.includes('game') || name.includes('valorant')) {
    return {
      kind: 'gaming' as const,
      chip: 'bg-violet-50/90 border-violet-200/80 text-violet-600',
      tag: 'Gaming (Time)',
    }
  }
  if (
    name.includes('item') ||
    name.includes('hard') ||
    name.includes('tech') ||
    name.includes('chassis') ||
    name.includes('phone')
  ) {
    return {
      kind: 'items' as const,
      chip: 'bg-sky-50/90 border-sky-200/80 text-sky-600',
      tag: 'Items (Price)',
    }
  }
  if (name.includes('din') || name.includes('food') || name.includes('bbq') || name.includes('meal')) {
    return {
      kind: 'dining' as const,
      chip: 'bg-amber-50/90 border-amber-200/80 text-amber-600',
      tag: 'Dining (Time+)',
    }
  }
  if (name.includes('event') || name.includes('ticket') || name.includes('concert')) {
    return {
      kind: 'events' as const,
      chip: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-600',
      tag: 'Events (Time+)',
    }
  }
  return {
    kind: 'items' as const,
    chip: 'bg-zinc-100 border-zinc-200 text-zinc-600',
    tag: 'Items',
  }
}
