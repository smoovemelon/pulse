import type { ReactNode } from 'react'
import { PulseContext } from './context'
import { usePulseState } from './usePulseState'

export function PulseProvider({ children }: { children: ReactNode }) {
  const api = usePulseState()
  return <PulseContext.Provider value={api}>{children}</PulseContext.Provider>
}
