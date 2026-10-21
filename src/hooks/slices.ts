import { createContext, useContext } from 'react'
import type { EconomyApi } from './usePulseEconomy'
import type { LedgerApi } from './useLedger'
import type { NoticeApi } from './useNotice'
import type { SensoryApi } from './useSensory'
import type { SettingsApi } from './useSettings'
import type { VaultApi } from './useVault'

export interface PulseSlices {
  readonly economy: EconomyApi
  readonly ledger: LedgerApi
  readonly vault: VaultApi
  readonly sensory: SensoryApi
  readonly settings: SettingsApi
  readonly notice: NoticeApi
}

export const SliceContext = createContext<PulseSlices | null>(null)

export function useSlices(): PulseSlices {
  const slices = useContext(SliceContext)
  if (!slices) throw new Error('Pulse hooks must be used within PulseProvider')
  return slices
}
