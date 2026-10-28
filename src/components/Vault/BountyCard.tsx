import { useCore } from '../../hooks/core'
import { chargeCost, vaultTag } from '../../services/engine'
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
  const { state } = useCore()
  const price = chargeCost(state, item.baseCost)
  const canAfford = balance >= price
  const percent = price <= 0 ? 100 : Math.min(100, Math.round((balance / price) * 100))
  const visual = categoryVisual(item.category)

  return (
    <article className="depth-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${visual.chip}`}>
            <CategoryIcon kind={visual.kind} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">{item.category}</span>
            <h4 className="text-sm font-extrabold tracking-tight text-ink mt-1.5 break-words">{item.title}</h4>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-base font-extrabold text-ink font-num">{price.toLocaleString()}</span>
          <span className="text-[10px] font-extrabold text-faint ml-0.5 font-num">PTS</span>
        </div>
      </div>

      <VaultProgressBar
        percent={percent}
        formulaTag={vaultTag(item, state.economy)}
        canAfford={canAfford}
        shortfall={price - balance}
      />

      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className="flex items-center gap-1.5">
          <Button
            tone="ghost"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:text-ink active:scale-90"
            aria-label={`Edit ${item.title}`}
            onClick={onEdit}
          >
            <EditIcon />
          </Button>
          <Button
            tone="ghost"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:text-rose-600 active:scale-90"
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
