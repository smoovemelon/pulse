import { CloseIcon } from './Icons'
import { useNotice } from '../hooks/useNotice'

export function Toast() {
  const { toast, dismiss } = useNotice()
  if (!toast) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[5.75rem] z-[80] flex justify-center px-4">
      <div
        role="status"
        className="alert-in pointer-events-auto flex w-full max-w-[430px] items-start gap-3 rounded-2xl bg-ink px-3.5 py-3 text-canvas shadow-[0_16px_36px_-16px_rgba(0,0,0,0.55)]"
      >
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-canvas" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm font-bold leading-snug">{toast}</p>
        <button
          type="button"
          onClick={dismiss}
          className="press focus-ring -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-canvas"
          aria-label="Dismiss notification"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
