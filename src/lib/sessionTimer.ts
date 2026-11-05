type Snapshot = {
  readonly running: boolean
  readonly elapsedMs: number
}

type StoredTimer = {
  readonly running: boolean
  readonly startedAt: number | null
  readonly accrued: number
}

const TIMER_KEY = 'pulse_session_timer'

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

function persist() {
  try {
    const storage = globalThis.localStorage
    if (!storage) return
    if (!running && accrued === 0) {
      storage.removeItem(TIMER_KEY)
      return
    }
    const stored: StoredTimer = { running, startedAt, accrued }
    storage.setItem(TIMER_KEY, JSON.stringify(stored))
  } catch {
    // Private mode can refuse storage. The in-memory clock still runs.
  }
}

type NativeTimerState = {
  readonly known?: boolean
  readonly phase?: string
  readonly startedAt?: number
  readonly accrued?: number
}

type AndroidCap = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  nativePromise?: (plugin: string, method: string, options: { startedAt: number; accrued: number; elapsed: number }) => Promise<NativeTimerState>
}

function androidCap(): AndroidCap | null {
  const cap = (globalThis as { Capacitor?: AndroidCap }).Capacitor
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== 'android' || !cap.nativePromise) return null
  return cap
}

function nativeTimer(method: 'start' | 'pause' | 'stop') {
  const cap = androidCap()
  if (!cap?.nativePromise) return
  void cap.nativePromise('SessionTimer', method, { startedAt: startedAt ?? 0, accrued, elapsed: liveElapsed() }).catch(() => undefined)
}

function adopt(nextRunning: boolean, nextStarted: number | null, nextAccrued: number) {
  if (running === nextRunning && startedAt === nextStarted && accrued === nextAccrued) return
  running = nextRunning
  startedAt = nextStarted
  accrued = nextAccrued
  persist()
  emit()
}

async function reconcileNative() {
  const cap = androidCap()
  if (!cap?.nativePromise) return
  let state: NativeTimerState
  try {
    state = await cap.nativePromise('SessionTimer', 'state', { startedAt: 0, accrued: 0, elapsed: 0 })
  } catch {
    return
  }
  if (!state.known) {
    if (running && startedAt !== null) nativeTimer('start')
    return
  }
  if (state.phase === 'running' || state.phase === 'paused') {
    const nextStarted = typeof state.startedAt === 'number' && state.startedAt > 0 ? state.startedAt : null
    const nextAccrued = typeof state.accrued === 'number' && Number.isFinite(state.accrued) && state.accrued > 0 ? state.accrued : 0
    const nextRunning = state.phase === 'running' && nextStarted !== null
    adopt(nextRunning, nextRunning ? nextStarted : null, nextAccrued)
    return
  }
  if (running || accrued > 0) adopt(false, null, 0)
}

export function readSessionTimer(now = Date.now()): Snapshot {
  return { running, elapsedMs: liveElapsed(now) }
}

export function startSessionTimer(now = Date.now()) {
  if (running) return
  running = true
  startedAt = now
  persist()
  nativeTimer('start')
  emit()
}

export function pauseSessionTimer(now = Date.now()) {
  if (!running) return
  accrued = liveElapsed(now)
  running = false
  startedAt = null
  persist()
  nativeTimer('pause')
  emit()
}

export function resetSessionTimer() {
  running = false
  startedAt = null
  accrued = 0
  persist()
  nativeTimer('stop')
  emit()
}

export function restoreSessionTimer() {
  try {
    const raw = globalThis.localStorage?.getItem(TIMER_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<StoredTimer>
    const accruedNext = typeof parsed.accrued === 'number' && Number.isFinite(parsed.accrued) && parsed.accrued > 0 ? parsed.accrued : 0
    const startedNext = typeof parsed.startedAt === 'number' && Number.isFinite(parsed.startedAt) ? parsed.startedAt : null
    running = parsed.running === true && startedNext !== null
    startedAt = running ? startedNext : null
    accrued = accruedNext
  } catch {
    return
  }
  if (running) nativeTimer('start')
  if (listeners.size > 0) emit()
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

restoreSessionTimer()
void reconcileNative()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void reconcileNative()
  })
  window.setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (!running && accrued === 0) return
    void reconcileNative()
  }, 1000)
}
