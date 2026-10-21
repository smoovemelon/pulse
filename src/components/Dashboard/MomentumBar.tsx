import { BoltIcon } from '../Icons'

export function MomentumReadout({ earned, goal }: { readonly earned: number; readonly goal: number }) {
  return (
    <div className="text-right">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">Momentum</span>
      <div className="flex items-center justify-end gap-1.5 mt-1">
        <div className="w-6 h-6 rounded-lg depth-well flex items-center justify-center text-ink">
          <BoltIcon className="w-3.5 h-3.5" />
        </div>
        <span className="text-base font-extrabold text-ink font-num">
          <span data-testid="today-earned">{earned}</span>{' '}
          <span className="text-xs text-faint font-bold">/ {goal}</span>
        </span>
      </div>
    </div>
  )
}

export function MomentumBar({ percent }: { readonly percent: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="w-full depth-well h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          data-testid="momentum-bar"
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-zinc-800 to-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-faint">
        <span>Progress to Daily Target</span>
        <span className="font-num font-extrabold text-body">{percent}%</span>
      </div>
    </div>
  )
}
