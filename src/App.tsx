import { useEffect, useRef, useState } from 'react'
import { Dashboard } from './components/Dashboard/Dashboard'
import { HabitStack } from './components/Habits/HabitStack'
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
import { useBackLayer } from './hooks/useBackLayer'
import { useCore } from './hooks/core'
import { PulseProvider } from './hooks/PulseProvider'
import { usePulseEconomy } from './hooks/usePulseEconomy'
import { useSettings } from './hooks/useSettings'
import { shouldIntroduce } from './services/intro'
import type { VaultItem } from './types'

type OpenModal = 'action' | 'settings' | 'anchor' | 'vault' | 'spend' | null

function Shell() {
  const { state } = useCore()
  const { decayAlert, dismissDecay } = usePulseEconomy()
  const { saveUsername } = useSettings()
  const identityOpen = !state.isOnboarded || state.username.trim() === ''
  const [tab, setTab] = useState<'feed' | 'vault'>('feed')
  const [modal, setModal] = useState<OpenModal>(null)
  const [resumeAction, setResumeAction] = useState(false)
  const [editing, setEditing] = useState<VaultItem | null>(null)
  const [introOpen, setIntroOpen] = useState(() => shouldIntroduce(state) && state.isOnboarded && state.username.trim() !== '')

  const closeModal = () => {
    setResumeAction(false)
    setModal(null)
  }

  const resumeRef = useRef(resumeAction)
  resumeRef.current = resumeAction

  useBackLayer(tab === 'vault', () => setTab('feed'))
  useBackLayer(modal === 'action' || resumeAction, () => {
    setResumeAction(false)
    setModal(null)
  })
  useBackLayer(modal === 'settings', closeModal)
  useBackLayer(modal === 'spend', () => setModal(null))
  useBackLayer(modal === 'vault', () => setModal(null))
  useBackLayer(modal === 'anchor', () => {
    if (resumeRef.current) {
      setResumeAction(false)
      setModal('action')
      return
    }
    setModal(null)
  })
  useBackLayer(decayAlert !== null, dismissDecay)

  const sheetOpen = modal !== null || decayAlert !== null || introOpen || identityOpen

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
    <div className="dock-clearance min-h-dvh bg-canvas text-ink">
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
            <HabitStack />
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
            if (shouldIntroduce(state)) setIntroOpen(true)
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
