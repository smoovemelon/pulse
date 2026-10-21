import { weightClassStyles } from './weightStyles'

export function WeightClassPill({
  multiplier,
  label,
}: {
  readonly multiplier: number
  readonly label?: string
}) {
  const weight = weightClassStyles(multiplier)
  return (
    <span className={`font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 font-sans ${weight.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${weight.dot}`} />
      {label || weight.label}
    </span>
  )
}
