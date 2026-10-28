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
    <div data-testid="split-capsule" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-line bg-card px-3 py-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Forge</span>
          <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-well">
            <span className="absolute inset-y-0 left-1/2 w-px bg-faint" aria-hidden="true" />
            <span className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${width}%` }} />
          </div>
          <p className="mt-1.5 font-num text-[11px] font-extrabold text-ink">
            <span data-testid="today-earned">{earned}</span>
            <span className="text-faint"> / {goal} PTS</span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card px-3 py-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Chain</span>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {[0, 1, 2].map((index) => (
              <span key={index} className={`h-2 rounded-full ${index < decksComplete ? 'bg-ink' : 'bg-well'}`} />
            ))}
          </div>
          <p className="mt-1.5 font-num text-[11px] font-extrabold text-ink">{decksComplete} / 3 DECKS</p>
        </div>
      </div>
      <p data-testid="streak-chip" className="text-[11px] font-extrabold text-muted">
        ⚡ Forge: {forgeStreak}d | 🔗 Chain: {chainStreak}d (Tier {tier} · {discountPercent}% Off)
      </p>
    </div>
  )
}
