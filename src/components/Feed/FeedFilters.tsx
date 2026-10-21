import { Pill } from '../Common/Pill'
import type { FeedFilter } from '../../types'

const FILTERS: ReadonlyArray<{ readonly id: FeedFilter; readonly label: string }> = [
  { id: 'ALL', label: 'All Activity' },
  { id: 'HEAVY', label: 'Heavy/Cruiser (1.5x+)' },
  { id: 'ALIGNED', label: 'Anchor Aligned' },
  { id: 'SPEND', label: 'Unlocks' },
]

export function FeedFilters({
  filter,
  onFilter,
}: {
  readonly filter: FeedFilter
  readonly onFilter: (filter: FeedFilter) => void
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
      {FILTERS.map((item) => (
        <Pill key={item.id} active={filter === item.id} onClick={() => onFilter(item.id)}>
          {item.label}
        </Pill>
      ))}
    </div>
  )
}
