import { useCallback, useState } from 'react'
import { utcDateKey } from '../lib/dates'
import type { EarnDraft, FeedFilter, Transaction } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface LedgerApi {
  readonly filter: FeedFilter
  readonly entries: readonly Transaction[]
  readonly transactions: readonly Transaction[]
  setFilter: (filter: FeedFilter) => void
  appendEarn: (tx: EarnDraft) => void
}

function matches(tx: Transaction, filter: FeedFilter) {
  if (filter === 'HEAVY') return tx.type === 'EARN' && (tx.multiplier || 0) >= 1.5
  if (filter === 'ALIGNED') return tx.type === 'EARN' && (tx.anchor_alignment || 0) >= 4
  if (filter === 'SPEND') return tx.type === 'SPEND'
  return true
}

export function useLedgerController(): LedgerApi {
  const { state, read, commit, notify, feedback } = useCore()
  const [filter, setFilterState] = useState<FeedFilter>('ALL')

  const setFilter = useCallback(
    (next: FeedFilter) => {
      feedback('click')
      setFilterState(next)
    },
    [feedback],
  )

  const appendEarn = useCallback(
    (tx: EarnDraft) => {
      const current = read()
      commit({
        ...current,
        balance: current.balance + tx.points,
        transactions: [
          {
            ...tx,
            id: `tx-${Date.now()}`,
            type: 'EARN',
            timestamp: 'Today, Just now',
            date: utcDateKey(),
          },
          ...current.transactions,
        ],
      })
      feedback('earn')
      notify(`+${tx.points} PTS: "${tx.title}"`)
    },
    [commit, feedback, notify, read],
  )

  return {
    filter,
    entries: state.transactions,
    transactions: state.transactions.filter((tx) => matches(tx, filter)),
    setFilter,
    appendEarn,
  }
}

export function useLedger() {
  return useSlices().ledger
}
