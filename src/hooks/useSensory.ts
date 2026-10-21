import { useCallback } from 'react'
import type { FeedbackKind } from '../types'
import { useCore } from './core'
import { useSlices } from './slices'

export interface SensoryApi {
  readonly soundEnabled: boolean
  feedback: (type: FeedbackKind) => void
  toggleSound: () => void
}

export function useSensoryController(): SensoryApi {
  const { state, read, commit, feedback } = useCore()

  const toggleSound = useCallback(() => {
    const next = commit({ ...read(), soundEnabled: !read().soundEnabled })
    if (next.soundEnabled) feedback('click')
  }, [commit, feedback, read])

  return {
    soundEnabled: state.soundEnabled,
    feedback,
    toggleSound,
  }
}

export function useSensory() {
  return useSlices().sensory
}
