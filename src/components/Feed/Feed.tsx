import { useLedger } from '../../hooks/useLedger'
import { Eyebrow } from '../Common/primitives'
import { FeedFilters } from './FeedFilters'
import { TransactionList } from './TransactionList'

export function Feed() {
  const { filter, setFilter, transactions, deleteEntry } = useLedger()
  return (
    <main data-tour="ledger" className="flex flex-col gap-3">
      <Eyebrow>History</Eyebrow>
      <FeedFilters filter={filter} onFilter={setFilter} />
      <TransactionList transactions={transactions} onDelete={deleteEntry} />
    </main>
  )
}
