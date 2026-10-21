import { FlameIcon } from '../Icons'

export function StreakBadge({ streak }: { readonly streak: number }) {
  return (
    <div className="text-right">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Current Streak</span>
      <div className="flex items-center justify-end gap-1.5 mt-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink text-canvas">
          <FlameIcon className="h-[18px] w-[18px]" />
        </div>
        <span data-testid="current-streak" className="text-base font-extrabold text-ink font-num">
          {streak}
        </span>
      </div>
    </div>
  )
}
