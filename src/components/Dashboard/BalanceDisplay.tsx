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
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">{label}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          data-testid={testId}
          className={`${prominent ? 'text-5xl' : 'text-3xl'} font-extrabold tracking-tight font-num text-ink`}
        >
          {balance.toLocaleString()}
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted font-num">PTS</span>
      </div>
    </div>
  )
}
