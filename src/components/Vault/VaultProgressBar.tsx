export function VaultProgressBar({
  percent,
  formulaTag,
  canAfford,
  shortfall,
}: {
  readonly percent: number
  readonly formulaTag: string
  readonly canAfford: boolean
  readonly shortfall: number
}) {
  return (
    <div className="depth-well p-2.5 rounded-xl flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold gap-2">
        <span className="text-muted uppercase tracking-wider">
          Funded: {percent}% ({formulaTag})
        </span>
        <span className={canAfford ? 'text-emerald-600 font-extrabold dark:text-emerald-300' : 'text-faint'}>
          {canAfford ? 'Ready' : `Need ${shortfall} PTS`}
        </span>
      </div>
      <div className="meter-track h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
