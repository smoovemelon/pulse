import { useMemo, useState } from 'react'
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
  readonly badge: string
  readonly badgeClass: string
  readonly hint: string
  readonly hintClass: string
}> = [
  {
    id: 'Gaming',
    sub: 'Time only',
    idle: 'bg-violet-50 text-violet-700',
    badge: 'Gaming: Duration Only',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    hint: 'Fill in Duration (Hours). Price is disabled ($0). Calculated at 50 PTS / hr.',
    hintClass: 'text-violet-700',
  },
  {
    id: 'Items',
    sub: 'Price only',
    idle: 'bg-sky-50 text-sky-700',
    badge: 'Items: Price Only',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    hint: 'Fill in Price ($ USD). Duration is disabled (0 hrs). Calculated at 20 PTS / $.',
    hintClass: 'text-sky-700',
  },
  {
    id: 'Dining',
    sub: 'Needs time',
    idle: 'bg-amber-50 text-amber-700',
    badge: 'Dining: Time Required',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    hint: 'Duration is required. Price is optional: ($ × 20) + (hrs × 35), or hrs × 50 when the price is $0.',
    hintClass: 'text-amber-700',
  },
  {
    id: 'Events',
    sub: 'Needs time',
    idle: 'bg-emerald-50 text-emerald-700',
    badge: 'Events: Time Required',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hint: 'Duration is required for shows and events. Ticket price is optional and uses the same dining formula.',
    hintClass: 'text-emerald-700',
  },
]

function asCategory(value: string | undefined): VaultCategory {
  if (value === 'Items' || value === 'Dining' || value === 'Events' || value === 'Gaming') return value
  return 'Gaming'
}

export function BountyModal({ item, onClose }: { readonly item: VaultItem | null; readonly onClose: () => void }) {
  const { feedback } = useSensory()
  const { saveBounty } = useVault()
  const [title, setTitle] = useState(item?.title ?? '')
  const [category, setCategory] = useState<VaultCategory>(asCategory(item?.category))
  const [usd, setUsd] = useState(item?.usd ? String(item.usd) : '')
  const [hrs, setHrs] = useState(item?.hrs ? String(item.hrs) : '')

  const meta = CATEGORIES.find((entry) => entry.id === category) ?? CATEGORIES[0]
  const priceDisabled = category === 'Gaming'
  const hoursDisabled = category === 'Items'
  const quote = useMemo(
    () => calculateVaultValuation(category, priceDisabled ? 0 : Number(usd) || 0, hoursDisabled ? 0 : Number(hrs) || 0),
    [category, hoursDisabled, hrs, priceDisabled, usd],
  )

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
          placeholder="e.g., iPhone Duo, Korean BBQ, or 2 hrs Valorant"
          className="field w-full rounded-2xl p-3.5 text-xs font-bold focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Category</span>
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
          {CATEGORIES.map((entry) => {
            const active = entry.id === category
            return (
              <Button
                key={entry.id}
                tone={active ? 'pillActive' : 'pill'}
                data-testid={`cat-${entry.id}`}
                onClick={() => choose(entry.id)}
                className={`shrink-0 min-w-[94px] py-2.5 px-2.5 rounded-xl text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                  active ? 'scale-[1.02]' : ''
                }`}
              >
                <span>{entry.id}</span>
                <span className={`text-[8px] font-extrabold font-num px-1.5 py-0.5 rounded-md whitespace-nowrap ${active ? 'cat-sub-active' : entry.idle}`}>
                  {entry.sub}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="depth-well rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Valuation Parameters</span>
          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border font-num ${meta.badgeClass}`}>{meta.badge}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="bounty-usd" className="text-[9px] font-extrabold uppercase text-muted">Price (USD $)</label>
              <span className="text-[8px] text-faint font-bold font-num">20 PTS / $</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-faint">$</span>
              <input
                id="bounty-usd"
                data-testid="bounty-usd"
                type="number"
                step="any"
                min="0"
                disabled={priceDisabled}
                value={priceDisabled ? '' : usd}
                placeholder={priceDisabled ? 'N/A' : category === 'Items' ? 'e.g. 80' : 'Optional ($)'}
                onChange={(event) => setUsd(event.target.value)}
                className="field w-full rounded-xl pl-6 pr-2.5 py-2 text-xs font-num font-extrabold focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="bounty-hrs" className="text-[9px] font-extrabold uppercase text-muted">Duration (Hrs)</label>
              <span className="text-[8px] text-faint font-bold font-num">50 PTS / hr</span>
            </div>
            <div className="relative">
              <input
                id="bounty-hrs"
                data-testid="bounty-hrs"
                type="number"
                step="0.5"
                min="0"
                disabled={hoursDisabled}
                value={hoursDisabled ? '' : hrs}
                placeholder={hoursDisabled ? 'N/A' : 'e.g. 1.5'}
                onChange={(event) => setHrs(event.target.value)}
                className="field w-full rounded-xl px-2.5 py-2 pr-10 text-xs font-num font-extrabold focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-faint font-num">hrs</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted leading-relaxed font-medium pt-1 border-t border-line">
          <span className={`${meta.hintClass} font-extrabold`}>● </span>
          {meta.hint}
        </p>
      </div>

      <div className="depth-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block mb-0.5">Calculated Cost</span>
          <span className="text-[11px] font-bold text-body block">{quote.tag}</span>
        </div>
        <div className="text-right">
          <span data-testid="bounty-cost" className="text-2xl font-extrabold text-ink font-num">{quote.cost.toLocaleString()}</span>
          <span className="text-xs font-extrabold text-faint font-num ml-0.5">PTS</span>
        </div>
      </div>

      <Button
        tone="dark"
        data-testid="save-bounty"
        onClick={save}
        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all"
      >
        Confirm & Save to Vault
      </Button>
    </ModalSheet>
  )
}
