type Snapshot = {
  readonly running: boolean
  readonly elapsedMs: number
}

let running = false
let startedAt: number | null = null
let accrued = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function liveElapsed(now = Date.now()): number {
  if (running && startedAt !== null) return accrued + (now - startedAt)
  return accrued
}

export function readSessionTimer(now = Date.now()): Snapshot {
  return { running, elapsedMs: liveElapsed(now) }
}

export function startSessionTimer(now = Date.now()) {
  if (running) return
  running = true
  startedAt = now
  emit()
}

export function pauseSessionTimer(now = Date.now()) {
  if (!running) return
  accrued = liveElapsed(now)
  running = false
  startedAt = null
  emit()
}

export function resetSessionTimer() {
  running = false
  startedAt = null
  accrued = 0
  emit()
}

export function subscribeSessionTimer(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function formatElapsed(elapsedMs: number): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function elapsedToDuration(elapsedMs: number): number {
  const minutes = Math.max(1, Math.round(elapsedMs / 60_000))
  return Math.max(5, Math.min(360, minutes))
}
