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
          <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <Eyebrow>{day.label}</Eyebrow>
            <span className="flex h-7 w-full items-center justify-center">
              <DayMark day={day} goal={goal} />
            </span>
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
    ? 'bg-ink'
    : day.mark === 'grace'
      ? 'bg-faint'
      : day.mark === 'missed'
        ? 'border border-line bg-well'
        : 'border border-line bg-card'
  return <span aria-hidden="true" className={`h-5 w-5 rounded-full ${tone}`} />
}
