import { useCallback, useState } from 'react'
import { celebrate } from '../lib/confetti'
import { localDateKey } from '../lib/dates'
import { createId } from '../lib/id'
import { balanceAfterRemoval, calculateVaultValuation, chargeCost, isLockedTransaction, removalShortfall, shaveWarning, validateVaultDraft } from '../services/engine'
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
  deleteEntry: (id: string) => void
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
      const points = tx.points
      const transactions = [
        {
          ...tx,
          points,
          formula_breakdown: tx.formula_breakdown,
          id: createId('tx'),
          type: 'EARN' as const,
          timestamp: new Date().toISOString(),
          date: localDateKey(),
        },
        ...current.transactions,
      ]
      const earned = {
        ...current,
        balance: current.balance + points,
        transactions,
      }
      commit(tx.weight_class?.startsWith('Heavyweight') || (tx.multiplier ?? 0) >= 2 ? shaveWarning(earned) : earned)
      feedback('earn')
      celebrate()
      notify(`+${points} PTS: "${tx.title}"`)
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
      const validation = validateVaultDraft(draft.measurementType, draft.amount)
      if (!validation.ok) {
        feedback('error')
        notify(validation.message)
        return false
      }
      const current = read()
      const quote = calculateVaultValuation(draft.measurementType, draft.amount, current.economy)
      if (quote.cost <= 0) {
        feedback('error')
        notify('Calculated cost must be at least 1 PTS')
        return false
      }
      const cost = chargeCost(current, quote.cost)
      if (current.balance < cost) {
        feedback('error')
        notify(`Need ${cost - current.balance} more PTS`)
        return false
      }
      const transactions = [
        {
          id: createId('tx'),
          type: 'SPEND' as const,
          title,
          points: cost,
          category: draft.category,
          formula_breakdown: quote.tag,
          timestamp: new Date().toISOString(),
          date: localDateKey(),
        },
        ...current.transactions,
      ]
      commit({
        ...current,
        balance: current.balance - cost,
        transactions,
      })
      feedback('spend')
      celebrate()
      notify(`-${cost} PTS: "${title}"`)
      return true
    },
    [commit, feedback, notify, read],
  )

  const deleteEntry = useCallback(
    (id: string) => {
      const current = read()
      const tx = current.transactions.find((item) => item.id === id)
      if (!tx) return
      if (isLockedTransaction(tx)) {
        feedback('error')
        notify('Discipline decay stays on the ledger')
        return
      }
      const balance = balanceAfterRemoval(current.balance, tx)
      const shortfall = removalShortfall(current.balance, tx)
      const transactions = current.transactions.filter((item) => item.id !== id)
      const delta = balance - current.balance
      commit({
        ...current,
        balance,
        transactions,
      })
      feedback(tx.type === 'EARN' ? 'spend' : 'earn')
      const signed = delta > 0 ? `+${delta}` : `${delta}`
      const unpaid = shortfall > 0 ? ` ${shortfall} PTS could not be recovered because the balance reached 0.` : ''
      notify(`Removed "${tx.title}". ${signed} PTS.${unpaid}`)
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
    deleteEntry,
  }
}

export function useLedger() {
  return useSlices().ledger
}
