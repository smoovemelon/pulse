import type { VaultCategory } from '../../types'
import { Button } from './Button'

const CATEGORIES: ReadonlyArray<{
  readonly id: VaultCategory
  readonly label: string
  readonly sub: string
}> = [
  { id: 'gaming', label: 'Gaming', sub: 'Time' },
  { id: 'streaming', label: 'Streaming', sub: 'Time' },
  { id: 'social', label: 'Social', sub: 'Time' },
  { id: 'dining', label: 'Dining', sub: 'Money' },
  { id: 'gear', label: 'Gear', sub: 'Money' },
  { id: 'outings', label: 'Outings', sub: 'Money' },
  { id: 'custom', label: 'Custom', sub: 'Either' },
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
            tone={active ? 'pillActive' : 'pill'}
            data-testid={`cat-${entry.id}`}
            onClick={() => onChange(entry.id)}
            className="w-full py-2.5 px-2.5 rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1"
          >
            <span>{entry.label}</span>
            <span className={`text-[8px] font-extrabold font-num px-1.5 py-0.5 rounded-md whitespace-nowrap ${active ? 'cat-sub-active' : 'chip-zinc'}`}>
              {entry.sub}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
