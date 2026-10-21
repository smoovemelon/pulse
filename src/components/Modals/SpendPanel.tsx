import { useMemo, useState } from 'react'
import { useLedger } from '../../hooks/useLedger'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { calculateVaultValuation } from '../../services/engine'
import type { VaultCategory } from '../../types'
import { Button } from '../Common/Button'

const CATEGORIES: readonly VaultCategory[] = ['Items', 'Dining', 'Events', 'Gaming']

export function SpendPanel({ onSpent }: { readonly onSpent: () => void }) {
  const { appendSpend } = useLedger()
  const { balance } = usePulseEconomy()
  const { feedback } = useSensory()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<VaultCategory>('Items')
  const [usd, setUsd] = useState('')
  const [hrs, setHrs] = useState('')

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

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((entry) => (
          <Button
            key={entry}
            tone={category === entry ? 'pillActive' : 'pill'}
            onClick={() => choose(entry)}
            className="shrink-0 px-3 py-2 rounded-xl text-[10px] font-black uppercase"
          >
            {entry}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label htmlFor="spend-usd" className="text-[9px] font-extrabold uppercase text-muted">
            Price (USD $)
          </label>
          <input
            id="spend-usd"
            data-testid="spend-usd"
            type="number"
            step="any"
            min="0"
            disabled={priceDisabled}
            value={priceDisabled ? '' : usd}
            placeholder={priceDisabled ? 'N/A' : 'e.g. 5'}
            onChange={(event) => setUsd(event.target.value)}
            className="field w-full rounded-xl px-3 py-2 text-xs font-num font-extrabold focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="spend-hrs" className="text-[9px] font-extrabold uppercase text-muted">
            Duration (Hrs)
          </label>
          <input
            id="spend-hrs"
            data-testid="spend-hrs"
            type="number"
            step="0.5"
            min="0"
            disabled={hoursDisabled}
            value={hoursDisabled ? '' : hrs}
            placeholder={hoursDisabled ? 'N/A' : 'e.g. 1'}
            onChange={(event) => setHrs(event.target.value)}
            className="field w-full rounded-xl px-3 py-2 text-xs font-num font-extrabold focus:outline-none"
          />
        </div>
      </div>

      <div className="depth-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block mb-0.5">Comes off now</span>
          <span className="text-[11px] font-bold text-body block">{quote.tag}</span>
          {shortfall > 0 && (
            <span className="text-[10px] font-bold text-rose-600 font-num block mt-1">Need {shortfall} more PTS</span>
          )}
        </div>
        <div className="text-right">
          <span data-testid="spend-cost" className="text-2xl font-extrabold text-rose-600 font-num">
            {quote.cost > 0 ? `-${quote.cost.toLocaleString()}` : '0'}
          </span>
          <span className="text-xs font-extrabold text-faint font-num ml-0.5">PTS</span>
        </div>
      </div>

      <Button
        tone="dark"
        data-testid="spend-now"
        onClick={spend}
        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md active:scale-95"
      >
        Spend now
      </Button>
    </>
  )
}
