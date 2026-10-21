import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard/Dashboard'
import { Dock } from './components/Dock'
import { Feed } from './components/Feed/Feed'
import { Header } from './components/Header'
import { IntroTour } from './components/Intro/IntroTour'
import { ActionModal } from './components/Modals/ActionModal'
import { AnchorModal } from './components/Modals/AnchorModal'
import { BountyModal } from './components/Modals/BountyModal'
import { DecayAlertModal } from './components/Modals/DecayAlertModal'
import { SpendModal } from './components/Modals/SpendPanel'
import { IdentityModal } from './components/Modals/IdentityModal'
import { SettingsModal } from './components/Modals/SettingsModal'
import { Toast } from './components/Toast'
import { Vault } from './components/Vault/Vault'
import { useCore } from './hooks/core'
import { PulseProvider } from './hooks/PulseProvider'
import { usePulseEconomy } from './hooks/usePulseEconomy'
import { useSettings } from './hooks/useSettings'
import { shouldIntroduce } from './services/intro'
import type { VaultItem } from './types'

type OpenModal = 'action' | 'settings' | 'anchor' | 'vault' | 'spend' | null

function Shell() {
  const { state } = useCore()
  const { decayAlert } = usePulseEconomy()
  const { saveUsername } = useSettings()
  const identityOpen = !state.isOnboarded || state.username.trim() === ''
  const [tab, setTab] = useState<'feed' | 'vault'>('feed')
  const [modal, setModal] = useState<OpenModal>(null)
  const [resumeAction, setResumeAction] = useState(false)
  const [editing, setEditing] = useState<VaultItem | null>(null)
  const [introOpen, setIntroOpen] = useState(false)

  const closeModal = () => {
    setResumeAction(false)
    setModal(null)
  }

  const sheetOpen = modal !== null || decayAlert !== null || introOpen || identityOpen

  useEffect(() => {
    if (identityOpen) return
    if (shouldIntroduce(state)) setIntroOpen(true)
  }, [identityOpen, state])
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setResumeAction(false)
        setModal(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas text-ink pb-[calc(7.5rem+env(safe-area-max-inset-bottom,0px))]">
      <Toast />
      <div className="w-full max-w-[430px] mx-auto px-4 pt-4 flex flex-col gap-4">
        <Header
          onOpenSettings={() => setModal('settings')}
          onOpenIntro={() => {
            setResumeAction(false)
            setModal(null)
            setIntroOpen(true)
          }}
        />
        {tab === 'feed' ? (
          <>
            <Dashboard
              onEditAnchor={() => {
                setResumeAction(false)
                setModal('anchor')
              }}
            />
            <Feed />
          </>
        ) : (
          <Vault
            onAdd={() => {
              setEditing(null)
              setModal('vault')
            }}
            onSpend={() => setModal('spend')}
            onEdit={(item) => {
              setEditing(item)
              setModal('vault')
            }}
          />
        )}
      </div>
      <Dock tab={tab} onTab={setTab} onAction={() => setModal('action')} />
      {(modal === 'action' || resumeAction) && (
        <ActionModal
          onClose={closeModal}
          onEditAnchor={() => {
            setResumeAction(true)
            setModal('anchor')
          }}
        />
      )}
      {modal === 'settings' && <SettingsModal onClose={closeModal} />}
      {modal === 'anchor' && (
        <AnchorModal
          onClose={() => {
            if (resumeAction) {
              setResumeAction(false)
              setModal('action')
              return
            }
            setModal(null)
          }}
        />
      )}
      {modal === 'vault' && <BountyModal item={editing} onClose={() => setModal(null)} />}
      {modal === 'spend' && <SpendModal onClose={() => setModal(null)} />}
      <DecayAlertModal />
      {introOpen && <IntroTour onClose={() => setIntroOpen(false)} />}
      {identityOpen && (
        <IdentityModal
          onConfirm={(username) => {
            saveUsername(username, { quiet: true })
            navigator.vibrate?.(20)
          }}
        />
      )}
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
