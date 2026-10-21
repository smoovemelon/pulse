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
    <div className="grid grid-cols-6 gap-1.5">
      {FILTERS.map((cat) => (
        <Pill
          key={cat}
          active={filter.toLowerCase() === cat.toLowerCase()}
          onClick={() => onFilter(cat)}
          className={`w-full justify-center px-1 ${cat === 'Dining' || cat === 'Events' ? 'col-span-3' : 'col-span-2'}`}
        >
          {cat === 'ALL' ? 'All Rewards' : cat}
        </Pill>
      ))}
    </div>
  )
}
