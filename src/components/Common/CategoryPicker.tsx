import type { VaultCategory } from '../../types'
import { CategoryIcon } from '../Icons'
import { Button } from './Button'

const CATEGORIES: ReadonlyArray<{
  readonly id: VaultCategory
  readonly label: string
  readonly sub: string
  readonly chip: string
  readonly kind: 'gaming' | 'food' | 'items' | 'events'
}> = [
  { id: 'gaming', label: 'Gaming', sub: 'Time', chip: 'chip-violet', kind: 'gaming' },
  { id: 'food', label: 'Food/Drink', sub: 'Money', chip: 'chip-amber', kind: 'food' },
  { id: 'items', label: 'Items', sub: 'Money', chip: 'chip-sky', kind: 'items' },
  { id: 'events', label: 'Events', sub: 'Money', chip: 'chip-emerald', kind: 'events' },
]

export function CategoryPicker({
  value,
  onChange,
}: {
  readonly value: VaultCategory
  readonly onChange: (category: VaultCategory) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CATEGORIES.map((entry) => {
        const active = entry.id === value
        return (
          <Button
            key={entry.id}
            tone="pill"
            data-testid={`cat-${entry.id}`}
            onClick={() => onChange(entry.id)}
            className={`no-dim flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-2.5 text-[10px] font-black uppercase ${active ? entry.chip : ''}`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${entry.chip}`}>
              <CategoryIcon kind={entry.kind} />
            </span>
            <span>{entry.label}</span>
            <span className="cat-tag rounded-md px-1.5 py-0.5 font-num text-[8px] font-extrabold whitespace-nowrap">
              {entry.sub}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
