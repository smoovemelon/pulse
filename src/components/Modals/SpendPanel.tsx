import { useMemo, useState } from 'react'
import { useLedger } from '../../hooks/useLedger'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { DEMO_SPEND } from '../../services/demo'
import { calculateVaultValuation } from '../../services/engine'
import type { VaultCategory } from '../../types'
import { Button } from '../Common/Button'
import { CategoryPicker } from '../Common/CategoryPicker'

export function SpendPanel({ onSpent }: { readonly onSpent: () => void }) {
  const { appendSpend } = useLedger()
  const { balance } = usePulseEconomy()
  const { feedback } = useSensory()
  const { demoMode } = useSettings()
  const [title, setTitle] = useState(demoMode ? DEMO_SPEND.title : '')
  const [category, setCategory] = useState<VaultCategory>(demoMode ? DEMO_SPEND.category : 'Items')
  const [usd, setUsd] = useState(demoMode ? DEMO_SPEND.usd : '')
  const [hrs, setHrs] = useState(demoMode ? DEMO_SPEND.hrs : '')

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

  const spend = () => {
    const ok = appendSpend({
      title,
      category,
      usd: priceDisabled ? 0 : Number(usd) || 0,
      hrs: hoursDisabled ? 0 : Number(hrs) || 0,
    })
    if (ok) onSpent()
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="spend-title" className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
          What did you spend on?
        </label>
        <input
          id="spend-title"
          data-testid="spend-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g., Coffee"
          className="field w-full rounded-2xl p-3.5 text-xs font-bold focus:outline-none"
        />
      </div>

      <CategoryPicker value={category} onChange={choose} />

      <div className={priceDisabled || hoursDisabled ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2.5'}>
        {!priceDisabled && (
          <div className="flex flex-col gap-1">
            <label htmlFor="spend-usd" className="text-[9px] font-extrabold uppercase text-muted">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-faint">$</span>
              <input
                id="spend-usd"
                data-testid="spend-usd"
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
            <label htmlFor="spend-hrs" className="text-[9px] font-extrabold uppercase text-muted">
              Duration (Hrs)
            </label>
            <div className="relative">
              <input
                id="spend-hrs"
                data-testid="spend-hrs"
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
