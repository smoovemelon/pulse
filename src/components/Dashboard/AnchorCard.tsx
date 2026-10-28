import { DEFAULT_ANCHOR } from '../../lib/dates'
import { Button } from '../Common/Button'
import { Eyebrow, IconTile, Well } from '../Common/primitives'
import { AnchorIcon } from '../Icons'

export function AnchorCard({ anchor, onEdit }: { readonly anchor: string; readonly onEdit: () => void }) {
  const placeholder = anchor === DEFAULT_ANCHOR
  return (
    <Well className="flex items-center justify-between p-3.5">
      <div className="flex min-w-0 items-center gap-2.5 pr-2">
        <IconTile>
          <AnchorIcon className="h-[18px] w-[18px]" />
        </IconTile>
        <div className="min-w-0">
          <Eyebrow className="block">Discipline Anchor</Eyebrow>
          <span
            data-testid="anchor-label"
            className={`block max-w-[180px] truncate text-xs font-extrabold tracking-tight ${placeholder ? 'text-faint' : 'text-ink'}`}
          >
            {anchor}
          </span>
        </div>
      </div>
      <Button tone="card" onClick={onEdit} className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-extrabold text-body">
        Edit
      </Button>
    </Well>
  )
}
