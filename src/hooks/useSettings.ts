import { useCallback, useState } from 'react'
import { callGemini } from '../lib/gemini'
import { enterDemo, exitDemo } from '../services/demo'
import { applyDifficulty, economyPreset } from '../services/engine'
import type { EconomyDifficulty } from '../types'
import { clearDemoSnapshot, clearIntroSeen, exportBackup as downloadBackup, freshState, mergeBackup, restoreStorageBackup } from '../services/persistence'
import { useCore } from './core'
import { useSlices } from './slices'

export interface SettingsApi {
  readonly apiKey: string
  readonly anchor: string
  readonly theme: 'light' | 'dark'
  readonly keyBadge: string
  readonly keyBadgeClass: string
  saveApiKey: (value: string) => void
  saveAnchor: (value: string) => boolean
  readonly username: string
  saveUsername: (value: string, options?: { readonly quiet?: boolean }) => boolean
  toggleTheme: () => void
  checkKey: (candidate?: string) => Promise<void>
  readonly demoMode: boolean
  readonly economy: ReturnType<typeof economyPreset>
  readonly difficultyLocked: boolean
  saveDifficulty: (difficulty: EconomyDifficulty) => void
  exportBackup: () => void
  importBackup: (file: File) => Promise<boolean>
  startFresh: () => void
  toggleDemo: () => void
}

export function useSettingsController(): SettingsApi {
  const { state, read, commit, notify, feedback, setDecayAlert } = useCore()
  const [keyBadge, setKeyBadge] = useState('Checking...')
  const [keyBadgeClass, setKeyBadgeClass] = useState('bg-well text-muted border-line')

  const checkKey = useCallback(async (candidate = read().apiKey) => {
    const trimmed = candidate.trim()
    if (!trimmed) {
      setKeyBadge('No Key Entered')
      setKeyBadgeClass('chip-amber')
      return
    }
    setKeyBadge('Testing...')
    setKeyBadgeClass('bg-well text-muted border-line')
    const started = performance.now()
    try {
      const { model } = await callGemini(
        {
          contents: [{ parts: [{ text: 'Respond with exactly: {"status":"OK"}' }] }],
          generationConfig: { responseMimeType: 'application/json' },
        },
        trimmed,
      )
      const elapsed = Math.round(performance.now() - started)
      setKeyBadge(`Online (${model} · ${elapsed}ms)`)
      setKeyBadgeClass('chip-emerald')
    } catch {
      setKeyBadge('Key Error')
      setKeyBadgeClass('chip-rose')
    }
  }, [read])

  const saveApiKey = useCallback(
    (value: string) => {
      feedback('click')
      commit({ ...read(), apiKey: value.trim() })
      notify(value.trim() ? 'API Key Saved' : 'Key Cleared')
    },
    [commit, feedback, notify, read],
  )

  const saveAnchor = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return false
      feedback('click')
      commit({ ...read(), disciplineAnchor: trimmed })
      notify('Discipline anchor updated')
      return true
    },
    [commit, feedback, notify, read],
  )

  const saveUsername = useCallback(
    (value: string, options?: { readonly quiet?: boolean }) => {
      const trimmed = value.trim()
      if (!trimmed) return false
      feedback('click')
      commit({ ...read(), username: trimmed, isOnboarded: true })
      if (!options?.quiet) notify('Display name updated')
      return true
    },
    [commit, feedback, notify, read],
  )

  const toggleTheme = useCallback(() => {
    feedback('click')
    commit({
      ...read(),
      theme: read().theme === 'dark' ? 'light' : 'dark',
    })
  }, [commit, feedback, read])

  const exportBackup = useCallback(() => {
    feedback('click')
    downloadBackup(read())
    notify('Backup JSON exported successfully')
  }, [feedback, notify, read])

  const startFresh = useCallback(() => {
    const current = read()
    if (!current.demoMode) clearDemoSnapshot()
    clearIntroSeen()
    commit({
      ...freshState(),
      demoMode: current.demoMode,
      username: current.username,
      isOnboarded: current.isOnboarded,
    })
    setDecayAlert(null)
    setKeyBadge('No Key Entered')
    setKeyBadgeClass('chip-amber')
    feedback('click')
    notify('Fresh start. Balance, ledger, and vault are clear.')
  }, [commit, feedback, notify, read, setDecayAlert])

  const toggleDemo = useCallback(() => {
    const current = read()
    feedback('click')
    if (current.demoMode) {
      commit(exitDemo(current))
      notify('Demo mode off. Your data is back.')
      return
    }
    commit(enterDemo(current))
    notify('Demo mode on. Sample values are filled in.')
  }, [commit, feedback, notify, read])

  const importBackup = useCallback(
    async (file: File) => {
      try {
        const parsed = JSON.parse(await file.text()) as unknown
        const restored = restoreStorageBackup(parsed)
        commit(restored ?? mergeBackup(read(), parsed))
        feedback('earn')
        notify('Data restored from backup file')
        return true
      } catch {
        feedback('error')
        notify('Invalid backup JSON file')
        return false
      }
    },
    [commit, feedback, notify, read],
  )

  const saveDifficulty = useCallback(
    (difficulty: EconomyDifficulty) => {
      const current = read()
      const next = applyDifficulty(current, difficulty)
      if (!next.ok) {
        feedback('error')
        notify('Start fresh to change the dial')
        return
      }
      if (next.state === current) return
      feedback('click')
      commit(next.state)
      notify(`${difficulty} prices are active`)
    },
    [commit, feedback, notify, read],
  )

  return {
    apiKey: state.apiKey,
    economy: state.economy,
    difficultyLocked: state.difficultyLocked,
    saveDifficulty,
    anchor: state.disciplineAnchor,
    theme: state.theme,
    keyBadge,
    keyBadgeClass,
    saveApiKey,
    saveAnchor,
    username: state.username,
    saveUsername,
    toggleTheme,
    checkKey,
    demoMode: state.demoMode,
    exportBackup,
    importBackup,
    startFresh,
    toggleDemo,
  }
}

export function useSettings() {
  return useSlices().settings
}
