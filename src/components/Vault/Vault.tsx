import { PlusIcon } from '../Icons'
import { useSensory } from '../../hooks/useSensory'
import { useVault } from '../../hooks/useVault'
import type { VaultItem } from '../../types'
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
      <div className="brand-mark rounded-[24px] p-5 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-0.5">Custom Reward Vault</span>
          <h3 className="text-base font-black tracking-tight">Unlock What You Earn</h3>
        </div>
        <button
          type="button"
          data-testid="add-bounty"
          onClick={() => {
            feedback('click')
            onAdd()
          }}
          className="px-4 py-2.5 rounded-2xl bg-white text-zinc-950 text-xs font-black shadow-[0_2px_8px_rgba(0,0,0,0.18)] active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Bounty
        </button>
      </div>

      <VaultFilters filter={filter} onFilter={setFilter} />

      <div className="space-y-3" data-testid="vault-list">
        {items.length === 0 && (
          <div className="depth-card rounded-2xl p-4 text-xs font-bold text-muted">No bounties in this category yet.</div>
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
