import { Eyebrow, Well } from '../Common/primitives'

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
  const streakDays = Math.min(forgeStreak, chainStreak)

  return (
    <div data-testid="split-capsule" className="flex flex-col gap-2.5">
      <Well className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>Forge</Eyebrow>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">
              <span data-testid="today-earned">{earned}</span>
              <span className="text-muted"> / {goal} PTS</span>
            </span>
          </div>
          <div className="min-w-0 text-right">
            <Eyebrow>Foundation</Eyebrow>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">
              {decksComplete}
              <span className="text-muted"> / 3 DECKS</span>
            </span>
          </div>
        </div>
        <div
          className="relative h-8 overflow-hidden rounded-full border border-zinc-400 bg-card dark:border-zinc-500"
          role="img"
          aria-label={`Forge ${earned} of ${goal} points. Foundation ${decksComplete} of 3 decks.`}
        >
          <span className="absolute inset-y-0 right-1/2 bg-ink" style={{ width: `${forge / 2}%` }} />
          <span className="absolute inset-y-0 left-1/2 bg-ink" style={{ width: `${chain / 2}%` }} />
        </div>
        <div data-testid="streak-chip" className="grid grid-cols-2 gap-2 border-t border-line pt-2.5">
          <div>
            <Eyebrow>Streak</Eyebrow>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">{streakDays}d</span>
          </div>
          <div className="text-right">
            <Eyebrow>Tier {tier}</Eyebrow>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">{discountPercent}% off</span>
          </div>
        </div>
      </Well>
    </div>
  )
}
