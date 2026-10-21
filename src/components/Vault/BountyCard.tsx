import { CategoryIcon, EditIcon, TrashIcon } from '../Icons'
import { Button } from '../Common/Button'
import type { VaultItem } from '../../types'
import { categoryVisual } from './categoryVisual'
import { UnlockButton } from './UnlockButton'
import { VaultProgressBar } from './VaultProgressBar'

export function BountyCard({
  item,
  balance,
  onEdit,
  onDelete,
  onUnlock,
}: {
  readonly item: VaultItem
  readonly balance: number
  readonly onEdit: () => void
  readonly onDelete: () => void
  readonly onUnlock: () => void
}) {
  const canAfford = balance >= item.cost
  const percent = item.cost <= 0 ? 100 : Math.min(100, Math.round((balance / item.cost) * 100))
  const visual = categoryVisual(item.category)

  return (
    <article className="depth-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${visual.chip}`}>
            <CategoryIcon kind={visual.kind} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-white tracking-wider">
              {item.category}
            </span>
            <h4 className="text-sm font-black text-ink mt-1.5 break-words">{item.title}</h4>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base font-black text-ink font-num">{item.cost.toLocaleString()}</span>
          <span className="text-[10px] font-bold text-muted ml-1 font-num">PTS</span>
        </div>
      </div>

      <VaultProgressBar
        percent={percent}
        formulaTag={item.formulaTag}
        canAfford={canAfford}
        shortfall={item.cost - balance}
      />

      <div className="flex items-center justify-between pt-1 border-t border-line">
        <div className="flex items-center gap-1.5">
          <Button
            tone="ghost"
            className="hover:text-ink p-1.5 rounded-lg active:scale-90"
            aria-label={`Edit ${item.title}`}
            onClick={onEdit}
          >
            <EditIcon />
          </Button>
          <Button
            tone="ghost"
            className="hover:text-rose-600 p-1.5 rounded-lg active:scale-90"
            aria-label={`Delete ${item.title}`}
            onClick={onDelete}
          >
            <TrashIcon />
          </Button>
        </div>
        <UnlockButton canAfford={canAfford} percent={percent} testId={`unlock-${item.id}`} onClick={onUnlock} />
      </div>
    </article>
  )
}
