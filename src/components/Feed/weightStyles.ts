export function weightClassStyles(multiplier = 1) {
  if (multiplier >= 2) {
    return {
      badge: 'chip-emerald',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
      label: 'Heavyweight (2.0x)',
    }
  }
  if (multiplier >= 1.5) {
    return {
      badge: 'chip-indigo',
      dot: 'bg-indigo-500',
      bar: 'bg-indigo-500',
      label: 'Cruiserweight (1.5x)',
    }
  }
  if (multiplier < 1) {
    return {
      badge: 'chip-zinc',
      dot: 'bg-zinc-500',
      bar: 'bg-zinc-400',
      label: 'Lightweight (0.5x)',
    }
  }
  return {
      badge: 'chip-zinc',
      dot: 'bg-zinc-400',
      bar: 'bg-ink',
    label: 'Middleweight (1.0x)',
  }
}
