import { CloseIcon } from './Icons'
import { useNotice } from '../hooks/useNotice'

export function Toast() {
  const { toast, dismiss } = useNotice()
  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[7.75rem] z-[80] flex justify-center px-4">
      <div
        role="status"
        className="notice-pop alert-in pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-[22px] px-3.5 py-3 text-ink"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-ink" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">{toast}</p>
        <button
          type="button"
          onClick={dismiss}
          className="press focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-well text-ink"
          aria-label="Dismiss notification"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
