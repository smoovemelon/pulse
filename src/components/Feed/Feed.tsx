import { useLedger } from '../../hooks/useLedger'
import { FeedFilters } from './FeedFilters'
import { TransactionList } from './TransactionList'

export function Feed() {
  const { filter, setFilter, transactions, deleteEntry } = useLedger()
  return (
    <main className="flex flex-col gap-3">
      <FeedFilters filter={filter} onFilter={setFilter} />
      <TransactionList transactions={transactions} onDelete={deleteEntry} />
    </main>
  )
}
