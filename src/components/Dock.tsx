import type { ReactNode } from 'react'
import { useSensory } from '../hooks/useSensory'
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

  return (
    <nav className="dock-bar">
      <div
        className="pointer-events-auto relative grid w-full max-w-[430px] grid-cols-[1fr_1fr_72px_1fr_1fr] items-center rounded-[32px] border border-line p-2 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.14)]"
        style={{ background: 'var(--dock)', backdropFilter: 'blur(24px)' }}
      >
        <DockTabButton
          label="Feed"
          active={tab === 'feed'}
          onClick={() => {
            feedback('click')
            onTab('feed')
          }}
        >
          <FeedIcon className="mb-0.5 h-5 w-5" />
        </DockTabButton>
        <DockTabButton
          label="Foundation"
          testId="nav-foundation"
          active={tab === 'foundation'}
          onClick={() => {
            feedback('click')
            onTab('foundation')
          }}
        >
          <FoundationIcon className="mb-0.5 h-5 w-5" />
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
            aria-label="Log action"
          >
            <PlusIcon className="h-7 w-7" />
          </button>
        </div>
        <DockTabButton
          label="Stats"
          testId="nav-stats"
          active={tab === 'stats'}
          onClick={() => {
            feedback('click')
            onTab('stats')
          }}
        >
          <StatsIcon className="mb-0.5 h-5 w-5" />
        </DockTabButton>
        <DockTabButton
          label="Vault"
          testId="nav-vault"
          active={tab === 'vault'}
          onClick={() => {
            feedback('click')
            onTab('vault')
          }}
        >
          <VaultIcon className="mb-0.5 h-5 w-5" />
        </DockTabButton>
      </div>
    </nav>
  )
}

function DockTabButton({
  label,
  active,
  onClick,
  testId,
  children,
}: {
  readonly label: string
  readonly active: boolean
  readonly onClick: () => void
  readonly testId?: string
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`dock-tab press flex w-full flex-col items-center justify-center rounded-2xl py-2 font-black ${
        active ? 'text-ink' : 'text-faint'
      }`}
    >
      <span className="dock-tab-mark flex flex-col items-center">
        {children}
        <span className="max-w-full truncate text-[8px] font-extrabold uppercase tracking-wide">{label}</span>
      </span>
    </button>
  )
}
