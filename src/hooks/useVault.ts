import { useCallback, useState } from 'react'
import { celebrate } from '../lib/confetti'
import { localDateKey } from '../lib/dates'
import { createId } from '../lib/id'
import { calculateVaultValuation, chargeCost, validateVaultDraft } from '../services/engine'
import type { BountyDraft, VaultFilter, VaultItem } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface VaultApi {
  readonly filter: VaultFilter
  readonly items: readonly VaultItem[]
  readonly balance: number
  setFilter: (filter: VaultFilter) => void
  saveBounty: (draft: BountyDraft) => boolean
  deleteBounty: (id: string) => void
  unlockBounty: (item: VaultItem) => void
}

export function useVaultController(): VaultApi {
  const { state, read, commit, notify, feedback } = useCore()
  const [filter, setFilterState] = useState<VaultFilter>('ALL')

  const setFilter = useCallback(
    (next: VaultFilter) => {
      feedback('click')
      setFilterState(next)
    },
    [feedback],
  )

  const saveBounty = useCallback(
    (draft: BountyDraft) => {
      const title = draft.title.trim()
      if (!title) {
        feedback('error')
        notify('Please enter a title for this reward')
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

      const nextItem: VaultItem = {
        id: draft.id || createId('v'),
        title,
        category: draft.category,
        measurementType: draft.measurementType,
        durationMinutes: draft.measurementType === 'time' ? draft.amount : 0,
        priceDollars: draft.measurementType === 'money' ? draft.amount : 0,
        baseCost: quote.cost,
        createdAt: current.vaultItems.find((item) => item.id === draft.id)?.createdAt ?? new Date().toISOString(),
      }
      const vaultItems = draft.id
        ? current.vaultItems.map((item) => (item.id === draft.id ? nextItem : item))
        : [nextItem, ...current.vaultItems]

      feedback('earn')
      commit({ ...current, vaultItems })
      notify(draft.id ? `Updated reward "${title}"` : `Added "${title}" (${quote.cost} PTS) to Vault`)
      return true
    },
    [commit, feedback, notify, read],
  )

  const deleteBounty = useCallback(
    (id: string) => {
      feedback('click')
      commit({
        ...read(),
        vaultItems: read().vaultItems.filter((item) => item.id !== id),
      })
      notify('Item removed from Vault')
    },
    [commit, feedback, notify, read],
  )

  const unlockBounty = useCallback(
    (item: VaultItem) => {
      const current = read()
      const cost = chargeCost(current, item.baseCost)
      if (current.balance < cost) {
        feedback('click')
        notify(`Need ${cost - current.balance} more PTS`)
        return
      }
      const transactions = [
        {
          id: createId('tx'),
          type: 'SPEND' as const,
          title: item.title,
          points: cost,
          category: item.category,
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
      notify(`Unlocked: "${item.title}"`)
    },
    [commit, feedback, notify, read],
  )

  const items =
    filter === 'ALL'
      ? state.vaultItems
      : state.vaultItems.filter((item) => item.category.toLowerCase() === filter.toLowerCase())

  return {
    filter,
    items,
    balance: state.balance,
    setFilter,
    saveBounty,
    deleteBounty,
    unlockBounty,
  }
}

export function useVault() {
  return useSlices().vault
}
