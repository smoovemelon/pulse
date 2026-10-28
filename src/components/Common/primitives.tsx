import type { HTMLAttributes, ReactNode } from 'react'

type BoxProps = HTMLAttributes<HTMLElement> & { readonly children: ReactNode }

export function Surface({ className = '', children, ...rest }: BoxProps) {
  return (
    <section className={`depth-card rounded-[28px] ${className}`.trim()} {...rest}>
      {children}
    </section>
  )
}

export function Well({ className = '', children, ...rest }: BoxProps) {
  return (
    <div className={`depth-well rounded-2xl ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}

export function Panel({ className = '', children, ...rest }: BoxProps) {
  return (
    <article className={`depth-card rounded-2xl ${className}`.trim()} {...rest}>
      {children}
    </article>
  )
}

export function Eyebrow({
  tone = 'faint',
  className = '',
  children,
}: {
  readonly tone?: 'faint' | 'muted'
  readonly className?: string
  readonly children: ReactNode
}) {
  const color = tone === 'muted' ? 'eyebrow-muted' : ''
  return <span className={`eyebrow ${color} ${className}`.trim()}>{children}</span>
}

export function IconTile({ className = '', children }: { readonly className?: string; readonly children: ReactNode }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink text-canvas ${className}`.trim()}>
      {children}
    </div>
  )
}
