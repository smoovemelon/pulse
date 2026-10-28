export function SplitCapsule({
  earned,
  goal,
  decksComplete,
  forgeStreak,
  chainStreak,
  tier,
  discountPercent,
}: {
  readonly earned: number
  readonly goal: number
  readonly decksComplete: number
  readonly forgeStreak: number
  readonly chainStreak: number
  readonly tier: number
  readonly discountPercent: number
}) {
  const width = Math.max(0, Math.min(100, goal <= 0 ? 0 : (earned / goal) * 100))

  return (
    <div data-testid="split-capsule" className="flex flex-col gap-2.5">
      <div
        className="flex items-stretch overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950"
        role="img"
        aria-label={`Forge ${earned} of ${goal} points. Chain ${decksComplete} of 3 decks.`}
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2.5 pr-2.5 pl-3">
          <div className="flex items-center justify-between gap-2 pr-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Forge</span>
            <span className="font-num text-[11px] font-extrabold tracking-tight text-ink">
              <span data-testid="today-earned">{earned}</span>
              <span className="text-muted"> / {goal} PTS</span>
            </span>
          </div>
          <div className="relative h-8 w-full overflow-hidden rounded-l-full bg-zinc-300 dark:bg-zinc-800">
            <span className="absolute inset-y-0 left-0 bg-orange-500" style={{ width: `${width}%` }} />
            <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-zinc-100 dark:bg-zinc-950" aria-hidden="true" />
          </div>
        </div>
        <div className="w-px shrink-0 self-stretch bg-zinc-300 dark:bg-zinc-700" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2.5 pr-3 pl-2.5">
          <div className="flex items-center justify-between gap-2 pl-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Chain</span>
            <span className="font-num text-[11px] font-extrabold tracking-tight text-ink">
              {decksComplete}
              <span className="text-muted"> / 3 DECKS</span>
            </span>
          </div>
          <div className="flex h-8 items-center gap-1">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-8 min-w-0 flex-1 rounded-[7px] ${index < decksComplete ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-800'}`}
              />
            ))}
            <span className="h-8 w-3 shrink-0 rounded-r-full bg-zinc-100 dark:bg-zinc-950" />
          </div>
        </div>
      </div>
      <p data-testid="streak-chip" className="text-center text-[10px] font-extrabold uppercase tracking-widest text-muted">
        Forge: {forgeStreak}d · Chain: {chainStreak}d · Tier {tier} ({discountPercent}% off)
      </p>
    </div>
  )
}
