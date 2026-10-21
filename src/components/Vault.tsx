import { CategoryIcon, EditIcon, PlusIcon, TrashIcon } from './Icons'
import { categoryVisual } from '../lib/economy'
import { usePulse } from '../pulse/context'
import type { VaultItem } from '../types'

const FILTERS = ['ALL', 'Gaming', 'Items', 'Dining', 'Events']

export function Vault({
  filter,
  onFilter,
  onAdd,
  onEdit,
}: {
  filter: string
  onFilter: (filter: string) => void
  onAdd: () => void
  onEdit: (item: VaultItem) => void
}) {
  const { state, feedback, deleteBounty, unlockBounty } = usePulse()
  const list =
    filter === 'ALL'
      ? state.vaultItems
      : state.vaultItems.filter((item) => (item.category || 'Items').toLowerCase() === filter.toLowerCase())

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

      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
        {FILTERS.map((cat) => {
          const active = filter.toLowerCase() === cat.toLowerCase()
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                feedback('click')
                onFilter(cat)
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase whitespace-nowrap active:scale-95 ${
                active ? 'depth-pill-active' : 'depth-pill'
              }`}
            >
              {cat === 'ALL' ? 'All Rewards' : cat}
            </button>
          )
        })}
      </div>

      <div className="space-y-3" data-testid="vault-list">
        {list.length === 0 && (
          <div className="depth-card rounded-2xl p-4 text-xs font-bold text-muted">No bounties in this category yet.</div>
        )}
        {list.map((item) => {
          const canAfford = state.balance >= item.cost
          const progressPct = item.cost <= 0 ? 100 : Math.min(100, Math.round((state.balance / item.cost) * 100))
          const visual = categoryVisual(item.category)
          return (
            <article key={item.id} className="depth-card rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${visual.chip}`}>
                    <CategoryIcon kind={visual.kind} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-white tracking-wider">
                      {item.category || 'Items'}
                    </span>
                    <h4 className="text-sm font-black text-ink mt-1.5 break-words">{item.title}</h4>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-ink font-num">{item.cost.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-muted ml-1 font-num">PTS</span>
                </div>
              </div>

              <div className="depth-well p-2.5 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold gap-2">
                  <span className="text-muted uppercase tracking-wider">
                    Funded: {progressPct}% ({item.formulaTag || ''})
                  </span>
                  <span className={canAfford ? 'text-emerald-600 font-black' : 'text-faint'}>
                    {canAfford ? '✓ Ready' : `Need ${item.cost - state.balance} PTS`}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${canAfford ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-line">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="text-faint hover:text-ink p-1.5 rounded-lg active:scale-90"
                    aria-label={`Edit ${item.title}`}
                    onClick={() => {
                      feedback('click')
                      onEdit(item)
                    }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="text-faint hover:text-rose-600 p-1.5 rounded-lg active:scale-90"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => deleteBounty(item.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
                <button
                  type="button"
                  data-testid={`unlock-${item.id}`}
                  onClick={() => unlockBounty(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                    canAfford ? 'depth-button-dark' : 'bg-well text-faint cursor-not-allowed border border-line'
                  }`}
                >
                  {canAfford ? 'Unlock Reward' : `${progressPct}% Funded`}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
