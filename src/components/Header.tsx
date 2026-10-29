import { useEffect, useState, type ReactNode } from 'react'
import { useSensory } from '../hooks/useSensory'
import { useSettings } from '../hooks/useSettings'
import { greetingDate, greetingLine } from '../lib/greeting'
import { Button } from './Common/Button'
import { GuideIcon, SettingsIcon } from './Icons'

export function Header({ onOpenSettings, onOpenIntro }: { onOpenSettings: () => void; onOpenIntro: () => void }) {
  const { username } = useSettings()
  const { feedback } = useSensory()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 data-testid="greeting" className="text-[1.35rem] font-extrabold leading-none tracking-tight text-ink">
          {greetingLine(now.getHours(), username)}
        </h1>
        <p data-testid="greeting-date" className="mt-1.5 text-[13px] font-medium leading-none text-muted">
          {greetingDate(now)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HeaderButton label="Open tutorial" testId="open-intro" onClick={() => { feedback('click'); onOpenIntro() }}>
          <GuideIcon className="h-5 w-5" />
        </HeaderButton>
        <HeaderButton label="Settings" testId="open-settings" onClick={() => { feedback('click'); onOpenSettings() }}>
          <SettingsIcon className="h-5 w-5" />
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
    <Button
      tone="card"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-2xl text-ink"
      aria-label={label}
      data-testid={testId}
    >
      {children}
    </Button>
  )
}
