import { useMemo, useState } from 'react'
import { useLedger } from '../../hooks/useLedger'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { DEMO_SPEND } from '../../services/demo'
import { calculateVaultValuation, measurementFor } from '../../services/engine'
import type { VaultCategory, VaultMeasurement } from '../../types'
import { Button } from '../Common/Button'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'
import { CategoryPicker } from '../Common/CategoryPicker'

export function SpendModal({ onClose }: { readonly onClose: () => void }) {
  return (
    <ModalSheet labelledBy="spend-heading" onDismiss={onClose}>
      <div className="flex justify-between items-center">
        <div>
          <span className="eyebrow block mb-0.5">Vault</span>
          <h3 id="spend-heading" className="text-base heading-athletic text-ink">
            Spend Points
          </h3>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <SpendPanel onSpent={onClose} />
    </ModalSheet>
  )
}

function SpendPanel({ onSpent }: { readonly onSpent: () => void }) {
  const { appendSpend } = useLedger()
  const { balance } = usePulseEconomy()
  const { feedback } = useSensory()
  const { demoMode, economy } = useSettings()
  const [title, setTitle] = useState(demoMode ? DEMO_SPEND.title : '')
  const [category, setCategory] = useState<VaultCategory>(demoMode ? DEMO_SPEND.category : 'gear')
  const [custom, setCustom] = useState<VaultMeasurement>('money')
  const [amount, setAmount] = useState(demoMode ? DEMO_SPEND.amount : '')
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
    setAmount('')
  }

  const spend = () => {
    const ok = appendSpend({ title, category, measurementType: measurement, amount: Number(amount) || 0 })
    if (ok) onSpent()
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="spend-title" className="eyebrow eyebrow-muted">
          What did you spend on?
        </label>
        <input
          id="spend-title"
          data-testid="spend-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g., Coffee"
          className="field w-full rounded-2xl p-3.5 text-xs font-bold"
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
        <label htmlFor="spend-amount" className="text-[9px] font-extrabold uppercase text-muted">
          {measurement === 'time' ? 'Duration (min)' : 'Price (USD)'}
        </label>
        <input
          id="spend-amount"
          data-testid="spend-usd"
          type="number"
          min="0"
          value={amount}
          placeholder={measurement === 'time' ? '60' : '5'}
          onChange={(event) => setAmount(event.target.value)}
          className="field w-full rounded-xl px-3 py-2 text-xs font-num font-extrabold"
        />
      </div>

      <div className="depth-card rounded-2xl px-4 py-3.5">
        <span className="eyebrow block">{quote.tag}</span>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted font-num whitespace-nowrap">
            Balance {balance.toLocaleString()}
          </span>
          {shortfall > 0 && (
            <span className="text-[11px] font-extrabold text-rose-600 font-num text-center">Need {shortfall} more</span>
          )}
          <span className="whitespace-nowrap text-right">
            <span data-testid="spend-cost" className="text-2xl font-extrabold text-rose-600 font-num">
              {quote.cost > 0 ? `-${quote.cost.toLocaleString()}` : '0'}
            </span>
            <span className="text-xs font-extrabold text-faint font-num ml-0.5">PTS</span>
          </span>
        </div>
      </div>

      <Button
        tone="dark"
        data-testid="spend-now"
        onClick={spend}
        className="action-btn"
      >
        Spend now
      </Button>
    </>
  )
}
