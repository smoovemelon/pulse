import { useSlices } from './slices'

export interface NoticeApi {
  readonly toast: string | null
  notify: (message: string) => void
  dismiss: () => void
}

export function useNotice() {
  return useSlices().notice
}
