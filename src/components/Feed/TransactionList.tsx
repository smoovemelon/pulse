import type { Transaction } from '../../types'
import { EmptyState } from '../Common/EmptyState'
import { TransactionCard } from './TransactionCard'

export function TransactionList({
  transactions,
  onDelete,
}: {
  readonly transactions: readonly Transaction[]
  readonly onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2.5" data-testid="tx-feed">
      {transactions.length === 0 && <EmptyState>Nothing in this view yet.</EmptyState>}
      {transactions.map((tx) => (
        <TransactionCard key={tx.id} tx={tx} onDelete={() => onDelete(tx.id)} />
      ))}
    </div>
  )
}
