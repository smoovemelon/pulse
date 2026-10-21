import { PlusIcon } from '../Icons'
import { useSensory } from '../../hooks/useSensory'
import { useVault } from '../../hooks/useVault'
import type { VaultItem } from '../../types'
import { Button } from '../Common/Button'
import { EmptyState } from '../Common/EmptyState'
import { BountyCard } from './BountyCard'
import { VaultFilters } from './VaultFilters'

export function Vault({
  onAdd,
  onEdit,
}: {
  readonly onAdd: () => void
  readonly onEdit: (item: VaultItem) => void
}) {
  const { items, balance, filter, setFilter, deleteBounty, unlockBounty } = useVault()
  const { feedback } = useSensory()

  return (
    <main className="flex flex-col gap-3">
      <div className="depth-card rounded-[24px] p-5 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block mb-0.5">Custom Reward Vault</span>
          <h3 className="text-base heading-athletic text-ink">Unlock What You Earn</h3>
        </div>
        <Button
          tone="dark"
          data-testid="add-bounty"
          onClick={() => {
            feedback('click')
            onAdd()
          }}
          className="px-3.5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

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
