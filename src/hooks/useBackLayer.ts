import { useEffect, useRef } from 'react'
import { pushEntry } from '../lib/backStack'

export function useBackLayer(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    if (!active) return
    let cancel = false
    let release: (() => void) | null = null
    queueMicrotask(() => {
      if (cancel) return
      release = pushEntry(() => onBackRef.current())
    })
    return () => {
      cancel = true
      release?.()
    }
  }, [active])
}
