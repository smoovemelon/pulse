import { Pill } from '../Common/Pill'
import type { FeedFilter } from '../../types'

const FILTERS: ReadonlyArray<{ readonly id: FeedFilter; readonly label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'EARNED', label: 'Earned' },
  { id: 'SPENT', label: 'Spent' },
  { id: 'DECAY', label: 'Decay' },
]

export function FeedFilters({
  filter,
  onFilter,
}: {
  readonly filter: FeedFilter
  readonly onFilter: (filter: FeedFilter) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {FILTERS.map((item) => (
        <Pill key={item.id} active={filter === item.id} onClick={() => onFilter(item.id)} className="w-full justify-center px-1">
          {item.label}
        </Pill>
      ))}
    </div>
  )
}
