import type { ReactNode } from 'react'
import { useSensory } from '../hooks/useSensory'
import { useSettings } from '../hooks/useSettings'
import { GuideIcon, MoonIcon, SettingsIcon, SunIcon, VolumeOff, VolumeOn } from './Icons'

export function Header({ onOpenSettings, onOpenIntro }: { onOpenSettings: () => void; onOpenIntro: () => void }) {
  const { theme, toggleTheme } = useSettings()
  const { soundEnabled, toggleSound, feedback } = useSensory()

  return (
    <header className="flex h-10 items-center justify-between">
      <h1 className="text-xl heading-athletic leading-none text-ink tracking-tighter">ALTIUS</h1>
      <div className="flex items-center gap-2">
        <HeaderButton label="Open tutorial" testId="open-intro" onClick={() => { feedback('click'); onOpenIntro() }}>
          <GuideIcon />
        </HeaderButton>
        <HeaderButton
          label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          testId="theme-toggle"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </HeaderButton>
        <HeaderButton label="Toggle Sound" testId="sound-toggle" onClick={toggleSound}>
          {soundEnabled ? <VolumeOn /> : <VolumeOff />}
        </HeaderButton>
        <HeaderButton label="Settings" testId="open-settings" onClick={() => { feedback('click'); onOpenSettings() }}>
          <SettingsIcon />
        </HeaderButton>
      </div>
    </header>
  )
}

function HeaderButton({
  label,
  testId,
  onClick,
  children,
}: {
  readonly label: string
  readonly testId: string
  readonly onClick: () => void
  readonly children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-2xl text-ink depth-card transition-all active:scale-95"
      aria-label={label}
      data-testid={testId}
    >
      {children}
    </button>
  )
}
