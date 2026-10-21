import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard/Dashboard'
import { Dock } from './components/Dock'
import { Feed } from './components/Feed/Feed'
import { Header } from './components/Header'
import { ActionModal } from './components/Modals/ActionModal'
import { AnchorModal } from './components/Modals/AnchorModal'
import { BountyModal } from './components/Modals/BountyModal'
import { DecayAlertModal } from './components/Modals/DecayAlertModal'
import { SettingsModal } from './components/Modals/SettingsModal'
import { Toast } from './components/Toast'
import { Vault } from './components/Vault/Vault'
import { PulseProvider } from './hooks/PulseProvider'
import { usePulseEconomy } from './hooks/usePulseEconomy'
import type { VaultItem } from './types'

type OpenModal = 'action' | 'settings' | 'anchor' | 'vault' | null

function Shell() {
  const { decayAlert } = usePulseEconomy()
  const [tab, setTab] = useState<'feed' | 'vault'>('feed')
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
    <div className="min-h-dvh bg-canvas text-ink pb-[calc(7.5rem+env(safe-area-max-inset-bottom,0px))]">
      <Toast />
      <div className="w-full max-w-[430px] mx-auto px-4 pt-4 flex flex-col gap-4">
        <Header onOpenSettings={() => setModal('settings')} />
        <Dashboard onEditAnchor={() => setModal('anchor')} />
        {tab === 'feed' ? (
          <Feed />
        ) : (
          <Vault
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
      <Dock tab={tab} onTab={setTab} onAction={() => setModal('action')} />
      {modal === 'action' && <ActionModal onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'anchor' && <AnchorModal onClose={() => setModal(null)} />}
      {modal === 'vault' && <BountyModal item={editing} onClose={() => setModal(null)} />}
      <DecayAlertModal />
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
