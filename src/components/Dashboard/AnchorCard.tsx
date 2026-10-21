import { DEFAULT_ANCHOR } from '../../lib/dates'
import { AnchorIcon } from '../Icons'
import { Button } from '../Common/Button'

export function AnchorCard({ anchor, onEdit }: { readonly anchor: string; readonly onEdit: () => void }) {
  const placeholder = anchor === DEFAULT_ANCHOR
  return (
    <div className="depth-well rounded-2xl p-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 pr-2 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink text-canvas">
          <AnchorIcon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block">Discipline Anchor</span>
          <span
            data-testid="anchor-label"
            className={`text-xs font-extrabold truncate max-w-[180px] block tracking-tight ${placeholder ? 'text-faint' : 'text-ink'}`}
          >
            {anchor}
          </span>
        </div>
      </div>
      <Button
        tone="card"
        onClick={onEdit}
        className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-body active:scale-95 transition-all shrink-0"
      >
        Edit
      </Button>
    </div>
  )
}
