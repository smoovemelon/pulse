export function BalanceDisplay({ balance }: { readonly balance: number }) {
  return (
    <div>
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Discipline Balance</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span data-testid="discipline-balance" className="text-3xl font-extrabold tracking-tight font-num text-ink">
          {balance.toLocaleString()}
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted font-num">PTS</span>
      </div>
    </div>
  )
}
