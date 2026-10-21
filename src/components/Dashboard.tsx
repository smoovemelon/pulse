import { BoltIcon, TargetIcon } from './Icons'
import { utcDateKey } from '../lib/dates'
import { earnedOn } from '../lib/economy'
import { usePulse } from '../pulse/context'

export function Dashboard({ onEditAnchor }: { onEditAnchor: () => void }) {
  const { state, feedback } = usePulse()
  const todayTotal = earnedOn(state.transactions, utcDateKey())
  const momentumPct = Math.min(100, Math.round((todayTotal / state.dailyGoal) * 100))

  return (
    <section className="depth-card rounded-[28px] p-5 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-zinc-200/40 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-baseline justify-between relative">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Discipline Balance</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span data-testid="discipline-balance" className="text-4xl font-extrabold tracking-tight font-num text-ink">
              {state.balance.toLocaleString()}
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted font-num">PTS</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Momentum</span>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <div className="w-6 h-6 rounded-lg depth-well flex items-center justify-center text-ink">
              <BoltIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-base font-extrabold text-ink font-num">
              <span data-testid="today-earned">{todayTotal}</span>{' '}
              <span className="text-xs text-faint font-bold">/ {state.dailyGoal}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="w-full depth-well h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            data-testid="momentum-bar"
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-zinc-800 to-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            style={{ width: `${momentumPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-faint">
          <span>Progress to Daily Target</span>
          <span className="font-num font-extrabold text-body">{momentumPct}%</span>
        </div>
      </div>

      <div className="depth-well rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 pr-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-50/90 border border-indigo-100/90 flex items-center justify-center shrink-0 text-indigo-600 shadow-[0_2px_6px_rgba(79,70,229,0.12)]">
            <TargetIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block">Discipline Anchor</span>
            <span data-testid="anchor-label" className="text-xs font-extrabold text-ink truncate max-w-[180px] block tracking-tight">
              {state.disciplineAnchor}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            feedback('click')
            onEditAnchor()
          }}
          className="px-3 py-1.5 rounded-xl depth-card text-[11px] font-extrabold text-body active:scale-95 transition-all shrink-0"
        >
          Edit
        </button>
      </div>
    </section>
  )
}
