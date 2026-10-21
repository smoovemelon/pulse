import type { StreakState, WeekDay } from '../../types'

export function StreakBadge({
  streak,
  multiplier,
  state,
  status,
  week,
  goal,
}: {
  readonly streak: number
  readonly multiplier: number
  readonly state: StreakState
  readonly status: string
  readonly week: readonly WeekDay[]
  readonly goal: number
}) {
  const statusClass = state === 'SECURED'
    ? 'text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.55)]'
    : state === 'SAFE'
      ? 'text-amber-400'
      : 'text-zinc-400'

  return (
    <section className="rounded-2xl border border-zinc-800 bg-slate-950 p-4 text-white" aria-label="Streak">
      <div className="flex items-center justify-between gap-3">
        <p className="font-num text-sm font-extrabold tracking-wide text-white">
          STREAK ▲ <span data-testid="current-streak">{streak}</span> DAYS
        </p>
        <span data-testid="streak-multiplier" className="shrink-0 rounded-full bg-orange-500/15 px-2 py-1 font-num text-[10px] font-extrabold tracking-wide text-orange-400">
          [ {multiplier.toFixed(1)}x BONUS ]
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-1.5">
        {week.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[9px] font-extrabold tracking-wider text-zinc-500">{day.label}</span>
            <DayMark day={day} goal={goal} />
          </div>
        ))}
      </div>
      <p data-testid="streak-status" className={`mt-4 text-[11px] font-semibold leading-relaxed ${statusClass}`}>
        {status}
      </p>
    </section>
  )
}

function DayMark({ day, goal }: { readonly day: WeekDay; readonly goal: number }) {
  if (day.mark === 'today') {
    const turn = Math.min(360, Math.round((day.earned / goal) * 360))
    return (
      <span className="relative flex h-7 w-7 items-center justify-center" aria-hidden="true">
        <span className="streak-today-ring absolute h-7 w-7 rounded-full border border-orange-500/80" />
        <span
          className="h-5 w-5 rounded-full"
          style={{ background: `conic-gradient(#f97316 ${turn}deg, #27272a 0deg)` }}
        />
      </span>
    )
  }

  const tone = day.mark === 'secured'
    ? 'h-2 bg-orange-500'
    : day.mark === 'grace'
      ? 'h-2 bg-zinc-700'
      : day.mark === 'missed'
        ? 'h-2 border border-zinc-700 bg-zinc-900'
        : day.mark === 'upcoming'
          ? 'h-2 border border-zinc-800'
          : 'h-2 border border-zinc-700'
  return <span aria-hidden="true" className={`w-full rounded-full ${tone}`} />
}
