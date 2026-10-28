import { Eyebrow } from '../Common/primitives'

export function BalanceDisplay({
  balance,
  label = 'Discipline Balance',
  testId = 'discipline-balance',
  prominent = false,
}: {
  readonly balance: number
  readonly label?: string
  readonly testId?: string
  readonly prominent?: boolean
}) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          data-testid={testId}
          className={`${prominent ? 'text-5xl' : 'text-3xl'} font-num font-extrabold tracking-tight text-ink`}
        >
          {balance.toLocaleString()}
        </span>
        <span className="font-num text-[11px] font-extrabold uppercase tracking-wider text-muted">PTS</span>
      </div>
    </div>
  )
}
