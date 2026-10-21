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
  const statusClass = state === 'SECURED' ? 'text-ink' : 'text-muted'

  return (
    <section className="depth-card rounded-[28px] p-4 text-ink" aria-label="Streak">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-faint">
          Streak ▲ <span data-testid="current-streak" className="font-num text-sm font-extrabold tracking-tight text-ink">{streak}</span> days
        </p>
        <span data-testid="streak-multiplier" className="shrink-0 rounded-full bg-ink px-2 py-1 text-[10px] font-extrabold tracking-wide text-canvas">
          <span className="font-num">{multiplier.toFixed(1)}x</span> bonus
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-1.5">
        {week.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">{day.label}</span>
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
        <span className="streak-today-ring absolute h-7 w-7 rounded-full border border-ink" />
        <span
          className="streak-today-fill h-5 w-5 rounded-full"
          style={{ ['--turn' as string]: `${turn}deg` }}
        />
      </span>
    )
  }

  const tone = day.mark === 'secured'
    ? 'h-2 bg-ink'
    : day.mark === 'grace'
      ? 'h-2 bg-faint'
      : day.mark === 'missed'
        ? 'h-2 border border-line bg-well'
        : 'h-2 border border-line'
  return <span aria-hidden="true" className={`w-full rounded-full ${tone}`} />
}
