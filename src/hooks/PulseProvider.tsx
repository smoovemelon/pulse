import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { triggerSensoryFeedback } from '../lib/audio'
import { loadState, saveState } from '../services/persistence'
import type { DecayAlert, FeedbackKind, PulseState } from '../types'
import { CoreContext, useCore, type PulseCore } from './core'
import { SliceContext, type PulseSlices } from './slices'
import { useEconomyController } from './usePulseEconomy'
import { useLedgerController } from './useLedger'
import { useSensoryController } from './useSensory'
import { useSettingsController } from './useSettings'
import { useVaultController } from './useVault'

function BindSlices({ children }: { children: ReactNode }) {
  const economy = useEconomyController()
  const ledger = useLedgerController()
  const vault = useVaultController()
  const sensory = useSensoryController()
  const settings = useSettingsController()
  const core = useCore()
  const slices = useMemo<PulseSlices>(
    () => ({
      economy,
      ledger,
      vault,
      sensory,
      settings,
      notice: { toast: core.toast, notify: core.notify },
    }),
    [core.notify, core.toast, economy, ledger, sensory, settings, vault],
  )
  return <SliceContext.Provider value={slices}>{children}</SliceContext.Provider>
}

export function PulseProvider({ children }: { children: ReactNode }) {
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

  const read = useCallback(() => stateRef.current, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const feedback = useCallback((type: FeedbackKind) => {
    triggerSensoryFeedback(type, stateRef.current.soundEnabled)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#18181B')
  }, [state.theme])

  const core = useMemo<PulseCore>(
    () => ({ state, read, commit, notify, toast, decayAlert, setDecayAlert, feedback }),
    [commit, decayAlert, feedback, notify, read, state, toast],
  )

  return (
    <CoreContext.Provider value={core}>
      <BindSlices>{children}</BindSlices>
    </CoreContext.Provider>
  )
}
