import { PlusIcon } from '../Icons'
import { useSensory } from '../../hooks/useSensory'
import { useVault } from '../../hooks/useVault'
import type { VaultItem } from '../../types'
import { Button } from '../Common/Button'
import { EmptyState } from '../Common/EmptyState'
import { BalanceDisplay } from '../Dashboard/BalanceDisplay'
import { BountyCard } from './BountyCard'
import { VaultFilters } from './VaultFilters'

export function Vault({
  onAdd,
  onSpend,
  onEdit,
}: {
  readonly onAdd: () => void
  readonly onSpend: () => void
  readonly onEdit: (item: VaultItem) => void
}) {
  const { items, balance, filter, setFilter, deleteBounty, unlockBounty } = useVault()
  const { feedback } = useSensory()

  return (
    <main className="flex flex-col gap-3">
      <section className="depth-card rounded-[28px] p-5 flex flex-col gap-4">
        <BalanceDisplay balance={balance} label="Balance" testId="vault-balance" prominent />
        <div className="grid grid-cols-2 gap-2">
          <Button
            tone="pill"
            data-testid="open-spend"
            onClick={() => {
              feedback('click')
              onSpend()
            }}
            className="py-2.5 rounded-2xl text-[11px] font-extrabold uppercase tracking-wider"
          >
            Spend
          </Button>
          <Button
            tone="dark"
            data-testid="add-bounty"
            onClick={() => {
              feedback('click')
              onAdd()
            }}
            className="py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider active:scale-95 flex items-center justify-center gap-1.5"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      </section>

      <VaultFilters filter={filter} onFilter={setFilter} />

      <div className="space-y-3" data-testid="vault-list">
        {items.length === 0 && (
          <EmptyState>No bounties in this category yet.</EmptyState>
        )}
        {items.map((item) => (
          <BountyCard
            key={item.id}
            item={item}
            balance={balance}
            onEdit={() => {
              feedback('click')
              onEdit(item)
            }}
            onDelete={() => deleteBounty(item.id)}
            onUnlock={() => unlockBounty(item)}
          />
        ))}
      </div>
    </main>
  )
}
