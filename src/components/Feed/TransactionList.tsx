import type { Transaction } from '../../types'
import { TransactionCard } from './TransactionCard'

export function TransactionList({ transactions }: { readonly transactions: readonly Transaction[] }) {
  return (
    <div className="space-y-2.5" data-testid="tx-feed">
      {transactions.length === 0 && (
        <div className="depth-card rounded-2xl p-4 text-xs font-bold text-muted">No activity in this filter yet.</div>
      )}
      {transactions.map((tx) => (
        <TransactionCard key={tx.id} tx={tx} />
      ))}
    </div>
  )
}
