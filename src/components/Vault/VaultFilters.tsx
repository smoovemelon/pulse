import { Pill } from '../Common/Pill'
import type { VaultFilter } from '../../types'

const FILTERS: readonly VaultFilter[] = ['ALL', 'Gaming', 'Items', 'Dining', 'Events']

export function VaultFilters({
  filter,
  onFilter,
}: {
  readonly filter: VaultFilter
  readonly onFilter: (filter: VaultFilter) => void
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
      {FILTERS.map((cat) => (
        <Pill
          key={cat}
          active={filter.toLowerCase() === cat.toLowerCase()}
          onClick={() => onFilter(cat)}
          className="uppercase active:scale-95"
        >
          {cat === 'ALL' ? 'All Rewards' : cat}
        </Pill>
      ))}
    </div>
  )
}
