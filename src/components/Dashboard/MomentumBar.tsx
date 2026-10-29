import { Eyebrow, Well } from '../Common/primitives'

export function SplitCapsule({
  earned,
  goal,
  decksComplete,
  forgeStreak,
  chainStreak,
  tier,
  discountPercent,
  warnings,
}: {
  readonly earned: number
  readonly goal: number
  readonly decksComplete: number
  readonly forgeStreak: number
  readonly chainStreak: number
  readonly tier: number
  readonly discountPercent: number
  readonly warnings: number
}) {
  const forge = Math.max(0, Math.min(100, goal <= 0 ? 0 : (earned / goal) * 100))
  const decks = Math.max(0, Math.min(3, decksComplete))

  return (
    <div data-testid="split-capsule" className="flex flex-col gap-2.5">
      <Well className={`flex flex-col gap-2.5 p-3.5 ${warnings > 0 ? 'warn-outline' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>Output</Eyebrow>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">
              <span data-testid="today-earned">{earned}</span>
              <span className="text-muted"> / {goal} PTS</span>
            </span>
          </div>
          <div className="min-w-0 text-right">
            <Eyebrow>Foundation</Eyebrow>
            <span className="mt-0.5 block font-num text-[11px] font-extrabold tracking-tight text-ink">
              {decks}
              <span className="text-muted"> / 3 DECKS</span>
            </span>
          </div>
        </div>
        <div
          className="relative mx-auto h-16 w-full max-w-[400px] overflow-hidden rounded-full border border-zinc-800 bg-zinc-950/90"
          role="img"
          aria-label={`Output ${earned} of ${goal} points. Foundation ${decks} of 3 decks.`}
        >
          <span className="absolute inset-y-0 right-1/2 bg-[#f97316]" style={{ width: `${forge / 2}%` }} />
          <span className="absolute inset-y-2 left-1/4 z-[1] w-px -translate-x-1/2 bg-white/80" aria-hidden="true" />
          <span className="absolute inset-y-1.5 left-1/2 right-1.5 z-[1] grid grid-cols-3 gap-1" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span key={index} className={`rounded-full ${index < decks ? 'bg-[#3b82f6]' : 'bg-zinc-700'}`} />
            ))}
          </span>
          <span className="absolute inset-y-0 left-1/2 z-[2] w-px bg-zinc-100" aria-hidden="true" />
        </div>
        <p data-testid="streak-chip" className="text-center font-num text-[10px] font-extrabold tracking-tight text-ink">
          OUTPUT: {forgeStreak}D · FOUNDATION: {chainStreak}D · TIER {tier} ({discountPercent}% OFF)
        </p>
        {warnings > 0 && (
          <p className="text-center text-[10px] font-bold text-amber-700 dark:text-amber-300">
            {warnings} warning{warnings === 1 ? '' : 's'} open
          </p>
        )}
      </Well>
    </div>
  )
}
