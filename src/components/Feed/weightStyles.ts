export function weightClassStyles(multiplier = 1) {
  if (multiplier >= 2) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
      label: 'Heavyweight (2.0x)',
    }
  }
  if (multiplier >= 1.5) {
    return {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
      bar: 'bg-indigo-500',
      label: 'Cruiserweight (1.5x)',
    }
  }
  return {
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot: 'bg-zinc-400',
    bar: 'bg-zinc-800',
    label: 'Middleweight (1.0x)',
  }
}
