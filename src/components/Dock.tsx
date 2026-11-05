import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useSensory } from '../hooks/useSensory'
import { formatElapsed, readSessionTimer, subscribeSessionTimer } from '../lib/sessionTimer'
import { FeedIcon, FoundationIcon, PlusIcon, StatsIcon, VaultIcon } from './Icons'

export type DockTab = 'feed' | 'foundation' | 'stats' | 'vault'

export function Dock({
  tab,
  onTab,
  onAction,
}: {
  tab: DockTab
  onTab: (tab: DockTab) => void
  onAction: () => void
}) {
  const { feedback } = useSensory()
  const timer = useSessionClock()
  const timing = timer.elapsedMs > 0
  const shellRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    const place = () => {
      const icon = shell.querySelector<HTMLElement>(`[data-dock-tab="${tab}"] .dock-icon`)
      if (!icon) return
      const shellBox = shell.getBoundingClientRect()
      const box = icon.getBoundingClientRect()
      const size = 36
      const next = {
        x: Math.round(box.left - shellBox.left + (box.width - size) / 2),
        y: Math.round(box.top - shellBox.top + (box.height - size) / 2),
        w: size,
        h: size,
      }
      setPill((prev) => (prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h ? prev : next))
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(shell)
    return () => observer.disconnect()
  }, [tab])

  return (
    <nav className="dock-bar">
      <div className="dock-fade" aria-hidden="true" />
      <div
        ref={shellRef}
        className="dock-shell pointer-events-auto relative grid w-full max-w-[430px] grid-cols-[1fr_1fr_72px_1fr_1fr] items-center rounded-[32px] p-2"
      >
        {pill && (
          <span
            className="dock-pill pointer-events-none absolute"
            style={{ width: pill.w, height: pill.h, transform: `translate(${pill.x}px, ${pill.y}px)` }}
            aria-hidden="true"
          />
        )}
        <DockTabButton
          id="feed"
          label="Feed"
          active={tab === 'feed'}
          onClick={() => {
            feedback('click')
            onTab('feed')
          }}
        >
          <FeedIcon className="h-5 w-5" />
        </DockTabButton>
        <DockTabButton
          id="foundation"
          label="Foundation"
          testId="nav-foundation"
          active={tab === 'foundation'}
          onClick={() => {
            feedback('click')
            onTab('foundation')
          }}
        >
          <FoundationIcon className="h-5 w-5" />
        </DockTabButton>
        <div className="relative -top-3.5 flex items-center justify-center">
          <button
            type="button"
            data-testid="open-action"
            data-tour="log"
            onClick={() => {
              feedback('click')
              onAction()
            }}
            className="focus-ring flex h-[72px] w-[72px] items-center justify-center rounded-full border text-3xl font-light shadow-[0_12px_28px_rgba(0,0,0,0.35)] depth-button-dark transition-transform active:scale-90"
            aria-label={timing ? `Log action, ${formatElapsed(timer.elapsedMs)}` : 'Log action'}
          >
            {timing ? (
              <span data-testid="dock-timer" className="font-num text-[11px] font-extrabold leading-none">
                {formatElapsed(timer.elapsedMs)}
              </span>
            ) : (
              <PlusIcon className="h-7 w-7" />
            )}
          </button>
        </div>
        <DockTabButton
          id="stats"
          label="Stats"
          testId="nav-stats"
          active={tab === 'stats'}
          onClick={() => {
            feedback('click')
            onTab('stats')
          }}
        >
          <StatsIcon className="h-5 w-5" />
        </DockTabButton>
        <DockTabButton
          id="vault"
          label="Vault"
          testId="nav-vault"
          active={tab === 'vault'}
          onClick={() => {
            feedback('click')
            onTab('vault')
          }}
        >
          <VaultIcon className="h-5 w-5" />
        </DockTabButton>
      </div>
    </nav>
  )
}

function useSessionClock() {
  const [timer, setTimer] = useState(() => readSessionTimer())
  useEffect(() => subscribeSessionTimer(() => setTimer(readSessionTimer())), [])
  useEffect(() => {
    if (!timer.running) return
    const id = window.setInterval(() => setTimer(readSessionTimer()), 250)
    return () => window.clearInterval(id)
  }, [timer.running])
  return timer
}

function DockTabButton({
  id,
  label,
  active,
  onClick,
  testId,
  children,
}: {
  readonly id: DockTab
  readonly label: string
  readonly active: boolean
  readonly onClick: () => void
  readonly testId?: string
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      data-dock-tab={id}
      data-testid={testId}
      onClick={onClick}
      aria-label={label}
      className={`dock-tab press flex w-full items-center justify-center rounded-2xl py-1.5 ${
        active ? 'text-ink' : 'text-faint'
      }`}
    >
      <span className="dock-tab-mark">
        <span className="dock-icon relative z-[1] flex h-8 w-8 items-center justify-center rounded-full">
          {children}
        </span>
      </span>
    </button>
  )
}
