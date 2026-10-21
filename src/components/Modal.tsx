import type { ReactNode } from 'react'
import { CloseIcon } from './Icons'

export function Modal({
  align = 'end',
  labelledBy,
  children,
}: {
  align?: 'end' | 'center'
  labelledBy: string
  children: ReactNode
}) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex justify-center ${
        align === 'center' ? 'items-center p-4' : 'items-end sm:items-center p-0 sm:p-5'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  )
}

export function Sheet({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`w-full max-w-[430px] bg-card text-ink rounded-t-[32px] sm:rounded-[32px] p-5 pb-6 border border-line shadow-2xl flex flex-col gap-4 animate-slide-up max-h-[90vh] overflow-y-auto sheet-scroll ${className}`}
    >
      {children}
    </div>
  )
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-well border border-line flex justify-center items-center text-muted active:scale-90"
      aria-label="Close"
    >
      <CloseIcon />
    </button>
  )
}
