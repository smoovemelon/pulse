import { Pill } from '../Common/Pill'
import type { VaultFilter } from '../../types'

const FILTERS: ReadonlyArray<readonly [VaultFilter, string]> = [
  ['ALL', 'All'],
  ['gaming', 'Gaming'],
  ['food', 'Food/Drink'],
  ['items', 'Items'],
  ['events', 'Events'],
]

export function VaultFilters({
  filter,
  onFilter,
}: {
  readonly filter: VaultFilter
  readonly onFilter: (filter: VaultFilter) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map(([id, label]) => (
        <Pill key={id} active={filter === id} onClick={() => onFilter(id)} className="px-2.5">
          {label}
        </Pill>
      ))}
    </div>
  )
}
