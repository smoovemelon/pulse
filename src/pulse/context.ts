import { createContext, useContext } from 'react'
import type { PulseApi } from './usePulseState'

export const PulseContext = createContext<PulseApi | null>(null)

export function usePulse() {
  const value = useContext(PulseContext)
  if (!value) throw new Error('usePulse must be used within PulseProvider')
  return value
}
