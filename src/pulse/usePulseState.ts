import { useCallback, useEffect, useRef, useState } from 'react'
import { runDecayAudit } from '../lib/audit'
import { triggerSensoryFeedback } from '../lib/audio'
import { quoteVault, validateVaultDraft } from '../lib/economy'
import { exportBackup, loadState, mergeBackup, saveState } from '../lib/storage'
import type { BountyDraft, DecayAlert, FeedbackKind, PulseState, Transaction, VaultItem } from '../types'

export interface PulseApi {
  state: PulseState
  toast: string | null
  decayAlert: DecayAlert | null
  notify: (message: string) => void
  feedback: (type: FeedbackKind) => void
  dismissDecay: () => void
  toggleSound: () => void
  toggleTheme: () => void
  toggleDecay: () => void
  saveAnchor: (value: string) => boolean
  saveApiKey: (value: string) => void
  exportBackup: () => void
  importBackup: (file: File) => Promise<boolean>
  saveBounty: (draft: BountyDraft) => boolean
  deleteBounty: (id: string) => void
  unlockBounty: (item: VaultItem) => void
  commitEarn: (tx: Omit<Transaction, 'id' | 'type' | 'timestamp' | 'date'>) => void
  runAudit: (force?: boolean) => void
}

export function usePulseState(): PulseApi {
  const [state, setState] = useState<PulseState>(() => loadState())
  const [toast, setToast] = useState<string | null>(null)
  const [decayAlert, setDecayAlert] = useState<DecayAlert | null>(null)
  const stateRef = useRef(state)
  const toastTimer = useRef<number | null>(null)

  const commit = useCallback((next: PulseState) => {
    stateRef.current = next
    saveState(next)
    setState(next)
    return next
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const feedback = useCallback((type: FeedbackKind) => {
    triggerSensoryFeedback(type, stateRef.current.soundEnabled)
  }, [])

  const applyAudit = useCallback(
    (force = false) => {
      const result = runDecayAudit(stateRef.current, force)
      if (result.changed) commit(result.state)
      if (result.alert) {
        setDecayAlert(result.alert)
        triggerSensoryFeedback('spend', result.state.soundEnabled)
        notify('Discipline Decay Applied: -15 PTS (Short of Daily Goal)')
      } else if (force && result.met) {
        notify(`Daily goal achieved (${result.earned}/${result.state.dailyGoal} PTS). No decay assessed!`)
      }
    },
    [commit, notify],
  )

  useEffect(() => {
    applyAudit(false)
  }, [applyAudit])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#18181B')
  }, [state.theme])

  const toggleSound = useCallback(() => {
    const next = commit({ ...stateRef.current, soundEnabled: !stateRef.current.soundEnabled })
    if (next.soundEnabled) triggerSensoryFeedback('click', true)
  }, [commit])

  const toggleTheme = useCallback(() => {
    feedback('click')
    commit({
      ...stateRef.current,
      theme: stateRef.current.theme === 'dark' ? 'light' : 'dark',
    })
  }, [commit, feedback])

  const toggleDecay = useCallback(() => {
    const next = commit({ ...stateRef.current, decayEnabled: !stateRef.current.decayEnabled })
    feedback('click')
    notify(next.decayEnabled ? 'Discipline decay enabled' : 'Discipline decay disabled')
  }, [commit, feedback, notify])

  const saveAnchor = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return false
      feedback('click')
      commit({ ...stateRef.current, disciplineAnchor: trimmed })
      notify('Discipline anchor updated')
      return true
    },
    [commit, feedback, notify],
  )

  const saveApiKey = useCallback(
    (value: string) => {
      feedback('click')
      commit({ ...stateRef.current, apiKey: value.trim() })
      notify(value.trim() ? 'API Key Saved' : 'Key Cleared')
    },
    [commit, feedback, notify],
  )

  const exportFile = useCallback(() => {
    feedback('click')
    exportBackup(stateRef.current)
    notify('Backup JSON exported successfully')
  }, [feedback, notify])

  const importBackup = useCallback(
    async (file: File) => {
      try {
        const parsed = JSON.parse(await file.text()) as unknown
        const next = mergeBackup(stateRef.current, parsed)
        commit(next)
        feedback('earn')
        notify('Data restored from backup file')
        return true
      } catch {
        feedback('error')
        notify('Invalid backup JSON file')
        return false
      }
    },
    [commit, feedback, notify],
  )

  const saveBounty = useCallback(
    (draft: BountyDraft) => {
      const title = draft.title.trim()
      if (!title) {
        feedback('error')
        notify('Please enter a title for this reward')
        return false
      }
      const validation = validateVaultDraft(draft.category, draft.usd, draft.hrs)
      if (!validation.ok) {
        feedback('error')
        notify(validation.message)
        return false
      }

      const quote = quoteVault(draft.category, draft.usd, draft.hrs)
      if (quote.cost <= 0) {
        feedback('error')
        notify('Calculated cost must be at least 1 PTS')
        return false
      }

      const current = stateRef.current
      const nextItem: VaultItem = {
        id: draft.id || `v-${Date.now()}`,
        title,
        category: draft.category,
        cost: quote.cost,
        usd: quote.usd,
        hrs: quote.hrs,
        formulaTag: quote.tag,
      }
      const vaultItems = draft.id
        ? current.vaultItems.map((item) => (item.id === draft.id ? nextItem : item))
        : [nextItem, ...current.vaultItems]

      feedback('earn')
      commit({ ...current, vaultItems })
      notify(draft.id ? `Updated reward "${title}"` : `Added "${title}" (${quote.cost} PTS) to Vault`)
      return true
    },
    [commit, feedback, notify],
  )

  const deleteBounty = useCallback(
    (id: string) => {
      feedback('click')
      commit({
        ...stateRef.current,
        vaultItems: stateRef.current.vaultItems.filter((item) => item.id !== id),
      })
      notify('Item removed from Vault')
    },
    [commit, feedback, notify],
  )

  const unlockBounty = useCallback(
    (item: VaultItem) => {
      const current = stateRef.current
      if (current.balance < item.cost) {
        feedback('click')
        notify(`Need ${item.cost - current.balance} more PTS`)
        return
      }
      commit({
        ...current,
        balance: current.balance - item.cost,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'SPEND',
            title: item.title,
            points: item.cost,
            category: item.category,
            timestamp: 'Today, Just now',
            date: new Date().toISOString().slice(0, 10),
          },
          ...current.transactions,
        ],
      })
      feedback('spend')
      notify(`Unlocked: "${item.title}"`)
    },
    [commit, feedback, notify],
  )

  const commitEarn = useCallback(
    (tx: Omit<Transaction, 'id' | 'type' | 'timestamp' | 'date'>) => {
      const current = stateRef.current
      commit({
        ...current,
        balance: current.balance + tx.points,
        transactions: [
          {
            ...tx,
            id: `tx-${Date.now()}`,
            type: 'EARN',
            timestamp: 'Today, Just now',
            date: new Date().toISOString().slice(0, 10),
          },
          ...current.transactions,
        ],
      })
      feedback('earn')
      notify(`+${tx.points} PTS: "${tx.title}"`)
    },
    [commit, feedback, notify],
  )

  return {
    state,
    toast,
    decayAlert,
    notify,
    feedback,
    dismissDecay: () => setDecayAlert(null),
    toggleSound,
    toggleTheme,
    toggleDecay,
    saveAnchor,
    saveApiKey,
    exportBackup: exportFile,
    importBackup,
    saveBounty,
    deleteBounty,
    unlockBounty,
    commitEarn,
    runAudit: applyAudit,
  }
}
