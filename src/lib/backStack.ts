type Entry = {
  onBack: () => void
  closed: boolean
}

const stack: Entry[] = []
let suppress = 0
let pending = 0
let flushQueued = false
let listening = false

function flush() {
  flushQueued = false
  const steps = pending
  pending = 0
  if (steps <= 0) return
  suppress += 1
  history.go(-steps)
}

function schedule(steps: number) {
  pending += steps
  if (flushQueued) return
  flushQueued = true
  queueMicrotask(flush)
}

function onPop() {
  if (suppress > 0) {
    suppress -= 1
    return
  }
  const entry = stack.pop()
  if (!entry || entry.closed) return
  entry.closed = true
  entry.onBack()
}

function listen() {
  if (listening) return
  listening = true
  window.addEventListener('popstate', onPop)
}

export function pushEntry(onBack: () => void): () => void {
  listen()
  const entry: Entry = { onBack, closed: false }
  history.pushState({ altius: stack.length + 1 }, '')
  stack.push(entry)
  return () => {
    if (entry.closed) return
    const index = stack.indexOf(entry)
    if (index === -1) return
    entry.closed = true
    const wasTop = index === stack.length - 1
    stack.splice(index, 1)
    if (wasTop) schedule(1)
  }
}
