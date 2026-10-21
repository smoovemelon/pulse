import { SparkleIcon } from '../Icons'
import type { Transaction } from '../../types'
import { WeightClassPill } from './WeightClassPill'
import { weightClassStyles } from './weightStyles'

export function TransactionCard({ tx }: { readonly tx: Transaction }) {
  const weight = weightClassStyles(tx.multiplier || 1)
  return (
    <article className="depth-card rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                tx.type === 'EARN' ? 'chip-emerald' : 'chip-rose'
              }`}
            >
              {tx.type}
            </span>
            <span className="text-[10px] text-faint font-bold">{tx.timestamp}</span>
          </div>
          <h4 className="text-sm font-extrabold text-ink mt-1.5 leading-snug tracking-tight break-words">{tx.title}</h4>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-base font-extrabold font-num ${tx.type === 'EARN' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {tx.type === 'EARN' ? `+${tx.points}` : `-${tx.points}`}
          </span>
          <span className="text-[10px] font-extrabold text-faint ml-0.5 font-num">PTS</span>
        </div>
      </div>

      {tx.type === 'EARN' && tx.effort_strain !== undefined && (
        <div className="depth-well p-2.5 rounded-xl flex flex-col gap-1.5 font-num">
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
            <div className="bg-line rounded-full overflow-hidden">
              <div className="bg-ink h-full rounded-full" style={{ width: `${(tx.effort_strain / 10) * 100}%` }} />
            </div>
            <div className="bg-line rounded-full overflow-hidden">
              <div className={`${weight.bar} h-full rounded-full`} style={{ width: `${((tx.anchor_alignment || 0) / 10) * 100}%` }} />
            </div>
          </div>
        </div>
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
    </article>
  )
}
