import type { Transaction } from '../../types'
import { EmptyState } from '../Common/EmptyState'
import { TransactionCard } from './TransactionCard'

export function TransactionList({ transactions }: { readonly transactions: readonly Transaction[] }) {
  return (
    <div className="space-y-2.5" data-testid="tx-feed">
      {transactions.length === 0 && <EmptyState>No activity in this filter yet.</EmptyState>}
      {transactions.map((tx) => (
        <TransactionCard key={tx.id} tx={tx} />
      ))}
    </div>
  )
}
