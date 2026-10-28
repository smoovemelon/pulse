import { useMemo, useState } from 'react'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { useVault } from '../../hooks/useVault'
import { DEMO_BOUNTY } from '../../services/demo'
import { calculateVaultValuation, measurementFor } from '../../services/engine'
import type { VaultCategory, VaultItem, VaultMeasurement } from '../../types'
import { Button } from '../Common/Button'
import { CategoryPicker } from '../Common/CategoryPicker'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'

export function BountyModal({ item, onClose }: { readonly item: VaultItem | null; readonly onClose: () => void }) {
  const { feedback } = useSensory()
  const { balance } = usePulseEconomy()
  const { demoMode, economy } = useSettings()
  const { saveBounty } = useVault()
  const seeded = !item && demoMode
  const [title, setTitle] = useState(item?.title ?? (seeded ? DEMO_BOUNTY.title : ''))
  const [category, setCategory] = useState<VaultCategory>(item?.category ?? (seeded ? DEMO_BOUNTY.category : 'gear'))
  const [custom, setCustom] = useState<VaultMeasurement>(item?.measurementType ?? 'money')
  const startingAmount = item
    ? String(item.measurementType === 'time' ? item.durationMinutes ?? 0 : item.priceDollars ?? 0)
    : seeded ? DEMO_BOUNTY.amount : ''
  const [amount, setAmount] = useState(startingAmount)
  const kind = measurementFor(category)
  const measurement: VaultMeasurement = kind === 'either' ? custom : kind
  const quote = useMemo(
    () => calculateVaultValuation(measurement, Number(amount) || 0, economy),
    [amount, economy, measurement],
  )
  const shortfall = quote.cost > balance ? quote.cost - balance : 0

  const choose = (next: VaultCategory) => {
    feedback('click')
    setCategory(next)
  }

  const save = () => {
    const ok = saveBounty({ id: item?.id, title, category, measurementType: measurement, amount: Number(amount) || 0 })
    if (ok) onClose()
  }

  return (
    <ModalSheet labelledBy="vault-editor-heading" onDismiss={onClose}>
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

      <CategoryPicker value={category} onChange={choose} />

      {category === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <Button tone={custom === 'time' ? 'pillActive' : 'pill'} onClick={() => setCustom('time')} className="rounded-xl py-2 text-[10px] font-extrabold">Minutes</Button>
          <Button tone={custom === 'money' ? 'pillActive' : 'pill'} onClick={() => setCustom('money')} className="rounded-xl py-2 text-[10px] font-extrabold">Dollars</Button>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="bounty-usd" className="text-[9px] font-extrabold uppercase text-muted">
          {measurement === 'time' ? 'Duration (min)' : 'Price (USD)'}
        </label>
        <input
          id="bounty-usd"
          data-testid="bounty-usd"
          type="number"
          min="0"
          value={amount}
          placeholder={measurement === 'time' ? '60' : '5'}
          onChange={(event) => setAmount(event.target.value)}
          className="field w-full rounded-xl px-3 py-2 text-xs font-num font-extrabold focus:outline-none"
        />
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
        className="action-btn"
      >
        Confirm & Save to Vault
      </Button>
    </ModalSheet>
  )
}
