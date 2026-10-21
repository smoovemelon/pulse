import { useCallback, useState } from 'react'
import { callGemini } from '../lib/gemini'
import { exportBackup as downloadBackup, mergeBackup } from '../services/persistence'
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
  toggleTheme: () => void
  checkKey: (candidate?: string) => Promise<void>
  exportBackup: () => void
  importBackup: (file: File) => Promise<boolean>
}

export function useSettingsController(): SettingsApi {
  const { state, read, commit, notify, feedback } = useCore()
  const [keyBadge, setKeyBadge] = useState('Checking...')
  const [keyBadgeClass, setKeyBadgeClass] = useState('bg-well text-muted border-line')

  const checkKey = useCallback(async (candidate = read().apiKey) => {
    const trimmed = candidate.trim()
    if (!trimmed) {
      setKeyBadge('No Key Entered')
      setKeyBadgeClass('bg-amber-50 text-amber-700 border-amber-200')
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
      setKeyBadgeClass('bg-emerald-50 text-emerald-700 border-emerald-200')
    } catch {
      setKeyBadge('Key Error')
      setKeyBadgeClass('bg-rose-50 text-rose-700 border-rose-200')
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

  const importBackup = useCallback(
    async (file: File) => {
      try {
        const parsed = JSON.parse(await file.text()) as unknown
        commit(mergeBackup(read(), parsed))
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

  return {
    apiKey: state.apiKey,
    anchor: state.disciplineAnchor,
    theme: state.theme,
    keyBadge,
    keyBadgeClass,
    saveApiKey,
    saveAnchor,
    toggleTheme,
    checkKey,
    exportBackup,
    importBackup,
  }
}

export function useSettings() {
  return useSlices().settings
}
