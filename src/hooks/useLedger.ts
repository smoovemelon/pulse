import { useCallback, useState } from 'react'
import { utcDateKey } from '../lib/dates'
import { calculateVaultValuation, validateVaultDraft } from '../services/engine'
import type { EarnDraft, FeedFilter, SpendDraft, Transaction } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface LedgerApi {
  readonly filter: FeedFilter
  readonly entries: readonly Transaction[]
  readonly transactions: readonly Transaction[]
  setFilter: (filter: FeedFilter) => void
  appendEarn: (tx: EarnDraft) => void
  appendSpend: (draft: SpendDraft) => boolean
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

  const appendSpend = useCallback(
    (draft: SpendDraft) => {
      const title = draft.title.trim()
      if (!title) {
        feedback('error')
        notify('Name what you spent on')
        return false
      }
      const validation = validateVaultDraft(draft.category, draft.usd, draft.hrs)
      if (!validation.ok) {
        feedback('error')
        notify(validation.message)
        return false
      }
      const quote = calculateVaultValuation(draft.category, draft.usd, draft.hrs)
      if (quote.cost <= 0) {
        feedback('error')
        notify('Calculated cost must be at least 1 PTS')
        return false
      }
      const current = read()
      if (current.balance < quote.cost) {
        feedback('error')
        notify(`Need ${quote.cost - current.balance} more PTS`)
        return false
      }
      commit({
        ...current,
        balance: current.balance - quote.cost,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'SPEND',
            title,
            points: quote.cost,
            category: draft.category,
            formula_breakdown: quote.tag,
            timestamp: 'Today, Just now',
            date: utcDateKey(),
          },
          ...current.transactions,
        ],
      })
      feedback('spend')
      notify(`-${quote.cost} PTS: "${title}"`)
      return true
    },
    [commit, feedback, notify, read],
  )

  return {
    filter,
    entries: state.transactions,
    transactions: state.transactions.filter((tx) => matches(tx, filter)),
    setFilter,
    appendEarn,
    appendSpend,
  }
}

export function useLedger() {
  return useSlices().ledger
}
