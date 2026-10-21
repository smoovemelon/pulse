import { Flame } from 'lucide-react'

export function StreakBadge({ streak }: { readonly streak: number }) {
  return (
    <div className="text-right">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Current Streak</span>
      <div className="flex items-center justify-end gap-1.5 mt-1">
        <div className="w-6 h-6 rounded-lg chip-amber border flex items-center justify-center">
          <Flame className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" />
        </div>
        <span data-testid="current-streak" className="text-base font-extrabold text-ink font-num">
          {streak}
        </span>
      </div>
    </div>
  )
}
