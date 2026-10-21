import { useEffect, useState } from 'react'
import { ActionSheet } from './components/ActionSheet'
import { AnchorModal } from './components/AnchorModal'
import { Dashboard } from './components/Dashboard'
import { DecayModal } from './components/DecayModal'
import { Dock } from './components/Dock'
import { Feed } from './components/Feed'
import { Header } from './components/Header'
import { SettingsSheet } from './components/SettingsSheet'
import { Toast } from './components/Toast'
import { Vault } from './components/Vault'
import { VaultEditor } from './components/VaultEditor'
import { PulseProvider } from './pulse/PulseProvider'
import { usePulse } from './pulse/context'
import type { FeedFilter, VaultItem } from './types'

type OpenModal = 'action' | 'settings' | 'anchor' | 'vault' | null

function Shell() {
  const { decayAlert } = usePulse()
  const [tab, setTab] = useState<'feed' | 'vault'>('feed')
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('ALL')
  const [vaultFilter, setVaultFilter] = useState('ALL')
  const [modal, setModal] = useState<OpenModal>(null)
  const [editing, setEditing] = useState<VaultItem | null>(null)

  const sheetOpen = modal !== null || decayAlert !== null
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas text-ink pb-28">
      <Toast />
      <div className="w-full max-w-[430px] mx-auto px-4 pt-4 flex flex-col gap-4">
        <Header onOpenSettings={() => setModal('settings')} />
        <Dashboard onEditAnchor={() => setModal('anchor')} />
        {tab === 'feed' ? (
          <Feed filter={feedFilter} onFilter={setFeedFilter} />
        ) : (
          <Vault
            filter={vaultFilter}
            onFilter={setVaultFilter}
            onAdd={() => {
              setEditing(null)
              setModal('vault')
            }}
            onEdit={(item) => {
              setEditing(item)
              setModal('vault')
            }}
          />
        )}
      </div>
      <Dock
        tab={tab}
        onTab={setTab}
        onAction={() => setModal('action')}
      />
      {modal === 'action' && <ActionSheet onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsSheet onClose={() => setModal(null)} />}
      {modal === 'anchor' && <AnchorModal onClose={() => setModal(null)} />}
      {modal === 'vault' && <VaultEditor item={editing} onClose={() => setModal(null)} />}
      <DecayModal />
    </div>
  )
}

export default function App() {
  return (
    <PulseProvider>
      <Shell />
    </PulseProvider>
  )
}
