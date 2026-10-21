import { Flame } from 'lucide-react'

export function StreakBadge({ streak }: { readonly streak: number }) {
  return (
    <div className="text-center">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Current Streak</span>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
          <Flame className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" />
        </div>
        <span data-testid="current-streak" className="text-base font-extrabold text-ink font-num">
          {streak}
        </span>
      </div>
    </div>
  )
}
