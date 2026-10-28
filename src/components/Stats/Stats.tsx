import { progressWindow } from '../../services/engine/progress'
import { lifetimeStats } from '../../services/engine'
import { useLedger } from '../../hooks/useLedger'
import { Eyebrow, Surface } from '../Common/primitives'

export function Stats() {
  const { transactions } = useLedger()
  const days = progressWindow(transactions)
  const life = lifetimeStats(transactions)
  const earned = days.reduce((sum, day) => sum + day.earned, 0)
  const spent = days.reduce((sum, day) => sum + day.spent, 0)
  const hits = days.filter((day) => day.onTarget).length
  const best = days.reduce((top, day) => (day.earned > top.earned ? day : top), days[0])
  const scale = Math.max(1, ...days.map((day) => Math.max(day.earned, day.goal)))
  const today = days[days.length - 1]

  return (
    <div className="flex flex-col gap-3" data-testid="stats">
      <Surface className="flex flex-col gap-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>Progress</Eyebrow>
            <p className="mt-1 font-num text-3xl font-extrabold tracking-tight text-ink">
              {earned}
              <span className="ml-1 text-sm font-bold text-muted">PTS</span>
            </p>
          </div>
          <p className="text-right text-[11px] font-bold leading-snug text-muted">
            14 days
            <span className="mt-0.5 block font-num text-ink">{spent} spent</span>
          </p>
        </div>
        <div
          data-testid="stats-chart"
          className="flex items-end gap-1"
          role="img"
          aria-label={`Earned points over 14 days. Today ${today?.earned ?? 0} of ${today?.goal ?? 0}.`}
        >
          {days.map((day) => {
            const bar = (day.earned / scale) * 100
            const goal = (day.goal / scale) * 100
            const current = day.date === today?.date
            return (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="relative flex h-28 w-full items-end justify-center">
                  <span className="absolute bottom-0 h-full w-2.5 rounded-full bg-well" />
                  <span className="absolute left-1/2 h-px w-3.5 -translate-x-1/2 bg-faint" style={{ bottom: `${goal}%` }} />
                  <span
                    className="relative w-2.5 rounded-full bg-ink"
                    style={{ height: `${bar}%`, opacity: current ? 1 : 0.55 }}
                  />
                </div>
                <span className={`font-num text-[9px] font-extrabold leading-none ${current ? 'text-ink' : 'text-faint'}`}>
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" />
            Earned
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-3 bg-faint" />
            Forge target
          </span>
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Earned" value={String(life.earned)} hint="All time" />
        <Stat label="Spent" value={String(life.spent)} hint="All time" />
        <Stat label="On target" value={`${hits}/${days.length}`} hint="This window" />
        <Stat label="Best day" value={best && best.earned > 0 ? String(best.earned) : '—'} hint="This window" />
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { readonly label: string; readonly value: string; readonly hint: string }) {
  return (
    <Surface className="flex flex-col gap-1 p-4">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-num text-2xl font-extrabold tracking-tight text-ink">{value}</span>
      <span className="text-[10px] font-bold text-faint">{hint}</span>
    </Surface>
  )
}
