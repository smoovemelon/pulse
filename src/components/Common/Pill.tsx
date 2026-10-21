import type { ReactNode } from 'react'
import { Button } from './Button'

export function Pill({
  active = false,
  className = '',
  children,
  onClick,
}: {
  readonly active?: boolean
  readonly className?: string
  readonly children: ReactNode
  readonly onClick: () => void
}) {
  return (
    <Button
      tone={active ? 'pillActive' : 'pill'}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap ${className}`.trim()}
    >
      {children}
    </Button>
  )
}
