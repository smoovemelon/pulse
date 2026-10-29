import { formatTimestamp } from '../../lib/dates'
import { isLockedTransaction } from '../../services/engine'
import { SparkleIcon, TrashIcon } from '../Icons'
import { Button } from '../Common/Button'
import { Panel, Well } from '../Common/primitives'
import type { Transaction } from '../../types'
import { categoryVisual } from '../Vault/categoryVisual'
import { WeightClassPill } from './WeightClassPill'
import { weightClassStyles } from './weightStyles'

function historyBadge(tx: Transaction) {
  if (tx.type === 'EARN') return { label: 'Earned', chip: 'chip-emerald' }
  if (tx.category === 'Decay Audit') return { label: 'Decay', chip: 'chip-rose' }
  if (tx.category) {
    const visual = categoryVisual(String(tx.category))
    return { label: visual.label, chip: visual.chip }
  }
  return { label: 'Spent', chip: 'chip-rose' }
}

export function TransactionCard({ tx, onDelete }: { readonly tx: Transaction; readonly onDelete: () => void }) {
  const weight = weightClassStyles(tx.multiplier || 1)
  const locked = isLockedTransaction(tx)
  const badge = historyBadge(tx)
  return (
    <Panel className="flex flex-col gap-2.5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.chip}`}
            >
              {badge.label}
            </span>
            {tx.type === 'EARN' && (tx.multiplier ?? 1) < 1 && (
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border chip-zinc">
                Off anchor
              </span>
            )}
            <span className="text-[10px] text-faint font-bold">{formatTimestamp(tx.timestamp)}</span>
          </div>
          <h4 className="text-sm font-extrabold text-ink mt-1.5 leading-snug tracking-tight break-words">{tx.title}</h4>
        </div>
        <div className="flex items-start gap-1 shrink-0">
          <div className="text-right">
            <span className={`text-base font-extrabold font-num ${tx.type === 'EARN' ? 'pts-earn' : 'pts-spend'}`}>
              {tx.type === 'EARN' ? `+${tx.points}` : `-${tx.points}`}
            </span>
            <span className="text-[10px] font-extrabold text-faint ml-0.5 font-num">PTS</span>
          </div>
          {!locked && (
            <Button
              tone="ghost"
              aria-label={`Delete ${tx.title}`}
              data-testid={`delete-${tx.id}`}
              onClick={onDelete}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:text-rose-600 active:scale-90"
            >
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>

      {tx.type === 'EARN' && tx.effort_strain !== undefined && (
        <Well className="flex flex-col gap-1.5 p-2.5 font-num">
          <div className="flex items-center justify-between text-[10px] font-bold text-body gap-2">
            <div className="flex gap-3">
              <span>
                Strain: <strong className="text-ink font-extrabold">{Number(tx.effort_strain).toFixed(1)}</strong>
              </span>
              <span>
                Align: <strong className="text-ink font-extrabold">{Number(tx.anchor_alignment || 0).toFixed(1)}</strong>
              </span>
            </div>
            <WeightClassPill multiplier={tx.multiplier || 1} label={tx.weight_class || weight.label} />
          </div>
          <div className="grid grid-cols-2 gap-2 h-1.5">
            <div className="meter-track overflow-hidden rounded-full bg-line">
              <div className="meter-fill h-full rounded-full bg-emerald-500" style={{ width: `${(tx.effort_strain / 10) * 100}%` }} />
            </div>
            <div className="meter-track overflow-hidden rounded-full bg-line">
              <div className={`meter-fill ${weight.bar} h-full rounded-full`} style={{ width: `${((tx.anchor_alignment || 0) / 10) * 100}%` }} />
            </div>
          </div>
        </Well>
      )}

      {tx.formula_breakdown && (
        <div className="text-[10px] font-num text-muted font-semibold px-0.5">{tx.formula_breakdown}</div>
      )}
      {tx.reasoning && (
        <div className="text-xs text-body leading-relaxed pt-2 border-t border-line flex items-start gap-1.5">
          <SparkleIcon className="w-3.5 h-3.5 text-faint shrink-0 mt-0.5" />
          <span>{tx.reasoning}</span>
        </div>
      )}
    </Panel>
  )
}
