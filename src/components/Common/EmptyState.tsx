import type { ReactNode } from 'react'

export function EmptyState({ children }: { readonly children: ReactNode }) {
  return <div className="depth-card rounded-2xl px-4 py-8 text-center text-xs font-bold text-muted">{children}</div>
}
