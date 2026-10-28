import type { ReactNode } from 'react'
import { Panel } from './primitives'

export function EmptyState({ children }: { readonly children: ReactNode }) {
  return <Panel className="px-4 py-8 text-center text-xs font-bold text-muted">{children}</Panel>
}
