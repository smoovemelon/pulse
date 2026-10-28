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
  const forge = Math.max(0, Math.min(100, goal <= 0 ? 0 : (earned / goal) * 100))
  const chain = Math.max(0, Math.min(100, (decksComplete / 3) * 100))

  return (
    <div data-testid="split-capsule" className="flex flex-col gap-2.5">
      <div className="depth-well flex flex-col gap-2.5 rounded-2xl p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Forge</span>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">
              <span data-testid="today-earned">{earned}</span>
              <span className="text-muted"> / {goal} PTS</span>
            </span>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Chain</span>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">
              {decksComplete}
              <span className="text-muted"> / 3 DECKS</span>
            </span>
          </div>
        </div>
        <div
          className="relative h-8 overflow-hidden rounded-full bg-card"
          role="img"
          aria-label={`Forge ${earned} of ${goal} points. Chain ${decksComplete} of 3 decks.`}
        >
          <span className="absolute inset-y-0 right-1/2 bg-orange-500" style={{ width: `${forge / 2}%` }} />
          <span className="absolute inset-y-0 left-1/2 bg-blue-500" style={{ width: `${chain / 2}%` }} />
        </div>
      </div>
      <p data-testid="streak-chip" className="text-center text-[10px] font-extrabold uppercase tracking-widest text-muted">
        Forge: {forgeStreak}d · Chain: {chainStreak}d · Tier {tier} ({discountPercent}% off)
      </p>
    </div>
  )
}
