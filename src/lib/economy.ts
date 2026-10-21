export {
  calculateActionPoints,
  earnedOn,
  localActionFallback,
  quoteVault,
  validateVaultDraft,
} from '../services/economy'

export function weightClassStyles(multiplier = 1) {
  if (multiplier >= 2) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
      label: 'Heavyweight (2.0x)',
    }
  }
  if (multiplier >= 1.5) {
    return {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
      bar: 'bg-indigo-500',
      label: 'Cruiserweight (1.5x)',
    }
  }
  return {
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot: 'bg-zinc-400',
    bar: 'bg-zinc-800',
    label: 'Middleweight (1.0x)',
  }
}

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
