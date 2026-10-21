import { useMemo, useState } from 'react'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useVault } from '../../hooks/useVault'
import { calculateVaultValuation } from '../../services/engine'
import type { VaultCategory, VaultItem } from '../../types'
import { Button } from '../Common/Button'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'

const CATEGORIES: ReadonlyArray<{
  readonly id: VaultCategory
  readonly sub: string
  readonly idle: string
}> = [
  { id: 'Items', sub: 'Price only', idle: 'bg-sky-50 text-sky-700' },
  { id: 'Dining', sub: 'Needs time', idle: 'bg-amber-50 text-amber-700' },
  { id: 'Events', sub: 'Needs time', idle: 'bg-emerald-50 text-emerald-700' },
  { id: 'Gaming', sub: 'Time only', idle: 'bg-violet-50 text-violet-700' },
]

function asCategory(value: string | undefined): VaultCategory {
  if (value === 'Items' || value === 'Dining' || value === 'Events' || value === 'Gaming') return value
  return 'Items'
}

export function BountyModal({ item, onClose }: { readonly item: VaultItem | null; readonly onClose: () => void }) {
  const { feedback } = useSensory()
  const { balance } = usePulseEconomy()
  const { saveBounty } = useVault()
  const [title, setTitle] = useState(item?.title ?? '')
  const [category, setCategory] = useState<VaultCategory>(asCategory(item?.category))
  const [usd, setUsd] = useState(item?.usd ? String(item.usd) : '')
  const [hrs, setHrs] = useState(item?.hrs ? String(item.hrs) : '')

  const priceDisabled = category === 'Gaming'
  const hoursDisabled = category === 'Items'
  const quote = useMemo(
    () => calculateVaultValuation(category, priceDisabled ? 0 : Number(usd) || 0, hoursDisabled ? 0 : Number(hrs) || 0),
    [category, hoursDisabled, hrs, priceDisabled, usd],
  )
  const shortfall = quote.cost > balance ? quote.cost - balance : 0

  const choose = (next: VaultCategory) => {
    feedback('click')
    setCategory(next)
    if (next === 'Gaming') setUsd('')
    if (next === 'Items') setHrs('')
  }

  const save = () => {
    const ok = saveBounty({
      id: item?.id,
      title,
      category,
      usd: priceDisabled ? 0 : Number(usd) || 0,
      hrs: hoursDisabled ? 0 : Number(hrs) || 0,
    })
    if (ok) onClose()
  }

  return (
    <ModalSheet labelledBy="vault-editor-heading">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block mb-0.5">
            {item ? 'Edit Existing Reward' : 'Reward Configurator'}
          </span>
          <h3 id="vault-editor-heading" className="text-base heading-athletic text-ink">
            {item ? 'Edit Vault Bounty' : 'Add Vault Bounty'}
          </h3>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bounty-title" className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
          Bounty Title
        </label>
        <input
          id="bounty-title"
          data-testid="bounty-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g., Coffee"
          className="field w-full rounded-2xl p-3.5 text-xs font-bold focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((entry) => {
          const active = entry.id === category
          return (
            <Button
              key={entry.id}
              tone={active ? 'pillActive' : 'pill'}
              data-testid={`cat-${entry.id}`}
              onClick={() => choose(entry.id)}
              className="w-full py-2.5 px-2.5 rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1"
            >
              <span>{entry.id}</span>
              <span className={`text-[8px] font-extrabold font-num px-1.5 py-0.5 rounded-md whitespace-nowrap ${active ? 'cat-sub-active' : entry.idle}`}>
                {entry.sub}
              </span>
            </Button>
          )
        })}
      </div>

      <div className={priceDisabled || hoursDisabled ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2.5'}>
        {!priceDisabled && (
          <div className="flex flex-col gap-1">
            <label htmlFor="bounty-usd" className="text-[9px] font-extrabold uppercase text-muted">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-faint">$</span>
              <input
                id="bounty-usd"
                data-testid="bounty-usd"
                type="number"
                step="any"
                min="0"
                value={usd}
                placeholder={category === 'Items' ? 'e.g. 5' : 'Optional'}
                onChange={(event) => setUsd(event.target.value)}
                className="field w-full rounded-xl pl-6 pr-3 py-2 text-xs font-num font-extrabold focus:outline-none"
              />
            </div>
          </div>
        )}
        {!hoursDisabled && (
          <div className="flex flex-col gap-1">
            <label htmlFor="bounty-hrs" className="text-[9px] font-extrabold uppercase text-muted">
              Duration (Hrs)
            </label>
            <div className="relative">
              <input
                id="bounty-hrs"
                data-testid="bounty-hrs"
                type="number"
                step="0.5"
                min="0"
                value={hrs}
                placeholder="e.g. 1"
                onChange={(event) => setHrs(event.target.value)}
                className="field w-full rounded-xl px-3 py-2 pr-10 text-xs font-num font-extrabold focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-faint font-num">hrs</span>
            </div>
          </div>
        )}
      </div>

      <div className="depth-card rounded-2xl px-4 py-3.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block">{quote.tag}</span>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted font-num whitespace-nowrap">
            Balance {balance.toLocaleString()}
          </span>
          {shortfall > 0 && (
            <span className="text-[11px] font-extrabold text-rose-600 font-num text-center">Need {shortfall} more</span>
          )}
          <span className="whitespace-nowrap text-right">
            <span data-testid="bounty-cost" className="text-2xl font-extrabold text-rose-600 font-num">
              {quote.cost > 0 ? quote.cost.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-extrabold text-faint font-num ml-0.5">PTS</span>
          </span>
        </div>
      </div>

      <Button
        tone="dark"
        data-testid="save-bounty"
        onClick={save}
        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95"
      >
        Confirm & Save to Vault
      </Button>
    </ModalSheet>
  )
}
