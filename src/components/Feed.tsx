import { SparkleIcon } from './Icons'
import { weightClassStyles } from '../lib/economy'
import { usePulse } from '../pulse/context'
import type { FeedFilter, Transaction } from '../types'

const FILTERS: Array<{ id: FeedFilter; label: string }> = [
  { id: 'ALL', label: 'All Activity' },
  { id: 'HEAVY', label: 'Heavy/Cruiser (1.5x+)' },
  { id: 'ALIGNED', label: 'Anchor Aligned' },
  { id: 'SPEND', label: 'Unlocks' },
]

function matches(tx: Transaction, filter: FeedFilter) {
  if (filter === 'HEAVY') return tx.type === 'EARN' && (tx.multiplier || 0) >= 1.5
  if (filter === 'ALIGNED') return tx.type === 'EARN' && (tx.anchor_alignment || 0) >= 4
  if (filter === 'SPEND') return tx.type === 'SPEND'
  return true
}

export function Feed({
  filter,
  onFilter,
}: {
  filter: FeedFilter
  onFilter: (filter: FeedFilter) => void
}) {
  const { state, feedback } = usePulse()
  const list = state.transactions.filter((tx) => matches(tx, filter))

  return (
    <main className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
        {FILTERS.map((item) => {
          const active = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                feedback('click')
                onFilter(item.id)
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap ${
                active ? 'depth-pill-active' : 'depth-pill'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-2.5" data-testid="tx-feed">
        {list.length === 0 && (
          <div className="depth-card rounded-2xl p-4 text-xs font-bold text-muted">No activity in this filter yet.</div>
        )}
        {list.map((tx) => {
          const weight = weightClassStyles(tx.multiplier || 1)
          return (
            <article key={tx.id} className="depth-card rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        tx.type === 'EARN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
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
                    <span className={`font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 font-sans ${weight.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${weight.dot}`} />
                      {tx.weight_class || weight.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 h-1.5">
                    <div className="bg-zinc-200 rounded-full overflow-hidden">
                      <div className="bg-zinc-800 h-full rounded-full" style={{ width: `${(tx.effort_strain / 10) * 100}%` }} />
                    </div>
                    <div className="bg-zinc-200 rounded-full overflow-hidden">
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
        })}
      </div>
    </main>
  )
}
