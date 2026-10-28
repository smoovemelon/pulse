import type { ReactNode } from 'react'
import { CloseIcon } from '../Icons'

export function Modal({
  align = 'end',
  labelledBy,
  onDismiss,
  children,
}: {
  readonly align?: 'end' | 'center'
  readonly labelledBy: string
  readonly onDismiss?: () => void
  readonly children: ReactNode
}) {
  return (
    <div
      data-testid="sheet-backdrop"
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex justify-center ${
        align === 'center' ? 'items-center p-4' : 'items-end sm:items-center p-0 sm:p-5'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss?.()
      }}
    >
      {children}
    </div>
  )
}

export function Sheet({
  children,
  className = '',
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <div
      className={`w-full max-w-[430px] bg-card text-ink rounded-t-[32px] sm:rounded-[32px] p-5 pb-6 border border-line shadow-2xl flex flex-col gap-4 animate-slide-up max-h-[90vh] overflow-y-auto sheet-scroll ${className}`}
    >
      {children}
    </div>
  )
}

export function ModalSheet({
  labelledBy,
  className = '',
  onDismiss,
  children,
}: {
  readonly labelledBy: string
  readonly className?: string
  readonly onDismiss?: () => void
  readonly children: ReactNode
}) {
  return (
    <Modal labelledBy={labelledBy} onDismiss={onDismiss}>
      <Sheet className={className}>{children}</Sheet>
    </Modal>
  )
}

export function CloseButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-line bg-well text-muted"
      aria-label="Close"
    >
      <CloseIcon />
    </button>
  )
}
