import type { StreakState, WeekDay } from '../../types'
import { Eyebrow } from '../Common/primitives'

export function StreakBadge({
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
    <div className="flex flex-col gap-3 text-ink" role="region" aria-label="Streak">
      <div className="flex items-start justify-between gap-1.5">
        {week.map((day) => (
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <Eyebrow>{day.label}</Eyebrow>
            <DayMark day={day} goal={goal} />
          </div>
        ))}
      </div>
      <p data-testid="streak-status" className={`text-center text-[11px] font-semibold leading-relaxed ${statusClass}`}>
        {status}
      </p>
    </div>
  )
}

function DayMark({ day, goal }: { readonly day: WeekDay; readonly goal: number }) {
  const ratio = goal > 0 ? Math.min(1, day.earned / goal) : 0
  const width = day.mark === 'secured' || day.mark === 'grace'
    ? '100%'
    : day.mark === 'today' || day.mark === 'missed'
      ? `${Math.round(ratio * 100)}%`
      : '0%'
  const fill = day.mark === 'secured' || day.mark === 'today' ? 'bg-emerald-500' : 'bg-emerald-500/45'
  const track = day.mark === 'today' ? 'streak-today-ring bg-line' : 'bg-well'

  return (
    <span aria-hidden="true" className={`meter-track relative block h-1.5 w-full overflow-hidden rounded-full ${track}`}>
      <span className={`absolute inset-y-0 left-0 rounded-full ${fill}`} style={{ width }} />
    </span>
  )
}
