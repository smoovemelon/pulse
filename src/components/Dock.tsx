import { useSensory } from '../hooks/useSensory'
import { FeedIcon, PlusIcon, VaultIcon } from './Icons'

export function Dock({
  tab,
  onTab,
  onAction,
}: {
  tab: 'feed' | 'vault'
  onTab: (tab: 'feed' | 'vault') => void
  onAction: () => void
}) {
  const { feedback } = useSensory()

  return (
    <nav className="dock-bar">
      <div
        className="w-full max-w-[430px] rounded-[32px] p-2 border border-line shadow-[0_16px_36px_-6px_rgba(0,0,0,0.14)] flex items-center justify-between pointer-events-auto relative"
        style={{ background: 'var(--dock)', backdropFilter: 'blur(24px)' }}
      >
        <button
          type="button"
          onClick={() => {
            feedback('click')
            onTab('feed')
          }}
          className={`press focus-ring flex flex-1 flex-col items-center justify-center rounded-2xl py-2 font-black ${
            tab === 'feed' ? 'text-ink' : 'text-faint'
          }`}
        >
          <FeedIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold">Feed</span>
        </button>
        <div className="relative -top-3.5 flex justify-center items-center px-2">
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
            <PlusIcon className="w-7 h-7" />
          </button>
        </div>
        <button
          type="button"
          data-testid="nav-vault"
          data-tour="vault"
          onClick={() => {
            feedback('click')
            onTab('vault')
          }}
          className={`press focus-ring flex flex-1 flex-col items-center justify-center rounded-2xl py-2 font-black ${
            tab === 'vault' ? 'text-ink' : 'text-faint'
          }`}
        >
          <VaultIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold">Vault</span>
        </button>
      </div>
    </nav>
  )
}
