import type { VaultCategory } from '../../types'

export function categoryLabel(catName = '') {
  const name = catName.toLowerCase()
  if (name === 'gaming' || name.includes('game')) return 'Gaming'
  if (name === 'food' || name === 'dining' || name.includes('food') || name.includes('din')) return 'Food/Drink'
  if (name === 'events' || name === 'outings' || name.includes('event') || name.includes('outing')) return 'Events'
  if (name === 'items' || name === 'gear' || name.includes('item')) return 'Items'
  return catName
}

export function categoryVisual(catName = '') {
  const name = catName.toLowerCase()
  if (name === 'gaming' || name.includes('game') || name.includes('stream')) {
    return { kind: 'gaming' as const, chip: 'chip-violet', label: 'Gaming' }
  }
  if (name === 'food' || name === 'dining' || name.includes('food') || name.includes('din') || name.includes('meal')) {
    return { kind: 'food' as const, chip: 'chip-amber', label: 'Food/Drink' }
  }
  if (name === 'events' || name === 'outings' || name.includes('event') || name.includes('outing') || name.includes('ticket')) {
    return { kind: 'events' as const, chip: 'chip-emerald', label: 'Events' }
  }
  return { kind: 'items' as const, chip: 'chip-sky', label: 'Items' }
}

export function categoryKind(category: VaultCategory) {
  return categoryVisual(category).kind
}
