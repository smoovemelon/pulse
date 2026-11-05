import { useState } from 'react'
import type { Transaction } from '../../types'
import { ChevronIcon } from '../Icons'
import { EmptyState } from '../Common/EmptyState'
import { TransactionCard } from './TransactionCard'

function isDecay(tx: Transaction) {
  return tx.type === 'SPEND' && tx.category === 'Decay Audit'
}

export function TransactionList({
  transactions,
  onDelete,
  groupDecay = false,
}: {
  readonly transactions: readonly Transaction[]
  readonly onDelete: (id: string) => void
  readonly groupDecay?: boolean
}) {
  const [open, setOpen] = useState(false)
  const decay = groupDecay ? transactions.filter(isDecay) : []
  const rows = groupDecay ? transactions.filter((tx) => !isDecay(tx)) : transactions

  return (
    <div className="space-y-2.5" data-testid="tx-feed">
      {rows.length === 0 && decay.length === 0 && <EmptyState>Nothing in this view yet.</EmptyState>}
      {rows.map((tx) => (
        <TransactionCard key={tx.id} tx={tx} onDelete={() => onDelete(tx.id)} />
      ))}
      {decay.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-testid="decay-toggle"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="press focus-ring flex w-full items-center justify-between rounded-2xl border border-line bg-well px-4 py-3 text-left"
          >
            <span className="text-xs font-extrabold text-ink">
              {decay.length} decay {decay.length === 1 ? 'row' : 'rows'}
            </span>
            <ChevronIcon className="text-muted" up={open} />
          </button>
          {open && decay.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} onDelete={() => onDelete(tx.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
