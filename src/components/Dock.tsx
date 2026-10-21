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
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl font-black ${
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
            onClick={() => {
              feedback('click')
              onAction()
            }}
            className="w-[72px] h-[72px] rounded-full depth-button-dark flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.35)] active:scale-90 transition-transform border text-3xl font-light"
            aria-label="Log action"
          >
            <PlusIcon className="w-7 h-7" />
          </button>
        </div>
        <button
          type="button"
          data-testid="nav-vault"
          onClick={() => {
            feedback('click')
            onTab('vault')
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl font-black ${
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
