import { useSensory } from '../hooks/useSensory'
import { useSettings } from '../hooks/useSettings'
import { MoonIcon, SettingsIcon, SunIcon, VolumeOff, VolumeOn } from './Icons'

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { theme, toggleTheme } = useSettings()
  const { soundEnabled, toggleSound, feedback } = useSensory()

  return (
    <header className="flex h-10 items-center justify-between">
      <h1 className="text-xl heading-athletic leading-none text-ink tracking-tighter">ALTIUS</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-2xl depth-card flex items-center justify-center text-ink active:scale-95 transition-all"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          type="button"
          onClick={toggleSound}
          className="w-10 h-10 rounded-2xl depth-card flex items-center justify-center text-ink active:scale-95 transition-all"
          aria-label="Toggle Sound"
          data-testid="sound-toggle"
        >
          {soundEnabled ? <VolumeOn className="w-4 h-4 text-ink" /> : <VolumeOff className="w-4 h-4 text-faint" />}
        </button>
        <button
          type="button"
          onClick={() => {
            feedback('click')
            onOpenSettings()
          }}
          className="h-10 px-3.5 rounded-2xl depth-card flex items-center gap-2 active:scale-95 transition-all text-body"
          data-testid="open-settings"
        >
          <SettingsIcon className="w-4 h-4 text-muted" />
          <span className="text-xs font-black tracking-tight text-ink">Settings</span>
        </button>
      </div>
    </header>
  )
}
