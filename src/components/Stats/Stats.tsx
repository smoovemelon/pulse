import { progressWindow } from '../../services/engine/progress'
import { lifetimeStats } from '../../services/engine'
import { useLedger } from '../../hooks/useLedger'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { Eyebrow, Surface, Well } from '../Common/primitives'

export function Stats() {
  const { transactions } = useLedger()
  const economy = usePulseEconomy()
  const days = progressWindow(transactions)
  const life = lifetimeStats(transactions)
  const earned = days.reduce((sum, day) => sum + day.earned, 0)
  const spent = days.reduce((sum, day) => sum + day.spent, 0)
  const hits = days.filter((day) => day.onTarget).length
  const best = days.reduce((top, day) => (day.earned > top.earned ? day : top), days[0])
  const scale = Math.max(1, ...days.map((day) => Math.max(day.earned, day.goal)))
  const today = days[days.length - 1]
  const slot = 280 / days.length

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
        <svg
          data-testid="stats-chart"
          viewBox="0 0 280 112"
          className="h-32 w-full"
          role="img"
          aria-label={`Earned points over 14 days. Today ${today?.earned ?? 0} of ${today?.goal ?? 0}.`}
        >
          {days.map((day, index) => {
            const bar = (day.earned / scale) * 96
            const goal = (day.goal / scale) * 96
            const x = index * slot + slot * 0.22
            const w = slot * 0.56
            const current = day.date === today?.date
            return (
              <g key={day.date}>
                <rect x={x} y={8} width={w} height={96} rx="4" fill="var(--well)" />
                <line x1={x} x2={x + w} y1={104 - goal} y2={104 - goal} stroke="var(--faint)" strokeWidth="1.25" />
                <rect x={x} y={104 - bar} width={w} height={bar} rx="4" fill="var(--ink)" opacity={current ? 1 : 0.55} />
              </g>
            )
          })}
        </svg>
        <div className="flex">
          {days.map((day) => (
            <span
              key={day.date}
              className={`flex-1 text-center font-num text-[8px] font-extrabold ${day.date === today?.date ? 'text-ink' : 'text-faint'}`}
            >
              {day.label}
            </span>
          ))}
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
        <Stat label="Balance" value={String(economy.balance)} hint="Now" />
        <Stat label="On target" value={`${hits}/${days.length}`} hint="This window" />
      </div>

      <Well className="grid grid-cols-3 gap-2 p-4">
        <Metric label="Forge" value={`${economy.forgeStreak}d`} />
        <Metric label="Foundation" value={`${economy.chainStreak}d`} />
        <Metric label="Best day" value={best && best.earned > 0 ? String(best.earned) : '—'} />
      </Well>
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

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0 text-center">
      <Eyebrow className="block">{label}</Eyebrow>
      <span className="mt-1 block truncate font-num text-lg font-extrabold tracking-tight text-ink">{value}</span>
    </div>
  )
}
