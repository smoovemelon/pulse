import type { ButtonHTMLAttributes } from 'react'

type ButtonTone = 'dark' | 'card' | 'pill' | 'pillActive' | 'muted' | 'ghost'

const TONE: Record<ButtonTone, string> = {
  dark: 'depth-button-dark',
  card: 'depth-card text-ink',
  pill: 'depth-pill',
  pillActive: 'depth-pill-active',
  muted: 'bg-well text-faint cursor-not-allowed border border-line',
  ghost: 'text-faint',
}

export function Button({
  tone = 'card',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly tone?: ButtonTone }) {
  return <button type={type} className={`press focus-ring ${TONE[tone]} ${className}`.trim()} {...props} />
}
