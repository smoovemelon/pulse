import { createContext, useContext } from 'react'
import type { DecayAlert, FeedbackKind, PulseState } from '../types'

export interface PulseCore {
  readonly state: PulseState
  read: () => PulseState
  commit: (next: PulseState) => PulseState
  notify: (message: string) => void
  dismissToast: () => void
  readonly toast: string | null
  readonly decayAlert: DecayAlert | null
  setDecayAlert: (alert: DecayAlert | null) => void
  feedback: (type: FeedbackKind) => void
}

export const CoreContext = createContext<PulseCore | null>(null)

export function useCore(): PulseCore {
  const core = useContext(CoreContext)
  if (!core) throw new Error('Pulse hooks must be used within PulseProvider')
  return core
}
