import { useEffect, useState, type ReactNode } from 'react'
import { RELEASE_LABEL } from '../../release'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { Button } from '../Common/Button'
import { DifficultyDial } from '../Common/DifficultyDial'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'
import { Eyebrow, Well } from '../Common/primitives'
import { CheckIcon, ChevronIcon, DownloadIcon, MoonIcon, SunIcon, UploadIcon, VolumeOff, VolumeOn } from '../Icons'

export function SettingsModal({ onClose }: { readonly onClose: () => void }) {
  const { saveApiKey, checkKey, apiKey, keyBadge, keyBadgeClass, exportBackup, importBackup, startFresh, demoMode, toggleDemo, username, saveUsername, theme, toggleTheme } = useSettings()
  const { feedback, soundEnabled, toggleSound } = useSensory()
  const [key, setKey] = useState(apiKey)
  const [name, setName] = useState(username)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const [freshArmed, setFreshArmed] = useState(false)
  const nameDirty = name.trim() !== '' && name.trim() !== username

  useEffect(() => {
    void checkKey(apiKey)
  }, [apiKey, checkKey])

  return (
    <ModalSheet labelledBy="settings-heading" className="max-h-[88vh]" onDismiss={onClose}>
      <div className="flex items-center justify-between gap-3">
        <h3 id="settings-heading" className="text-base heading-athletic text-ink">Settings</h3>
        <div className="flex items-center gap-2">
          <span data-testid="version-stamp" className="font-num text-[10px] font-extrabold tracking-wide text-faint">
            {RELEASE_LABEL}
          </span>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      <Well className="flex flex-col gap-3 px-4 py-3">
        <SettingRow
          icon={theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          label="Appearance"
        >
          <ToggleButton
            testId="theme-toggle"
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? 'Dark' : 'Light'}
          </ToggleButton>
        </SettingRow>
        <SettingRow
          icon={soundEnabled ? <VolumeOn className="h-4 w-4" /> : <VolumeOff className="h-4 w-4" />}
          label="Sound"
        >
          <ToggleButton testId="sound-toggle" label="Toggle Sound" onClick={toggleSound} muted={!soundEnabled}>
            {soundEnabled ? 'On' : 'Muted'}
          </ToggleButton>
        </SettingRow>
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="display-name" className="text-xs font-extrabold tracking-tight text-ink">
              Display name
            </label>
            <Button
              tone="dark"
              data-testid="save-display-name"
              disabled={!nameDirty}
              onClick={() => saveUsername(name)}
              className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black disabled:opacity-40"
            >
              Save
            </Button>
          </div>
          <input
            id="display-name"
            data-testid="display-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. adrinn"
            className="field w-full rounded-xl px-3 py-2.5 text-xs font-bold"
            autoComplete="nickname"
          />
        </div>
      </Well>

      <Well className="flex flex-col gap-2.5 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="api-key" className="text-xs font-extrabold tracking-tight text-ink">
            Gemini key
          </label>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${keyBadgeClass}`}>{keyBadge}</span>
        </div>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Paste a Google AI Studio key"
          className="field w-full rounded-xl px-3 py-2.5 text-xs font-mono"
          autoComplete="off"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            tone="card"
            onClick={() => {
              feedback('click')
              void checkKey(key)
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-extrabold"
          >
            <CheckIcon className="pts-earn h-3.5 w-3.5" />
            Test key
          </Button>
          <Button
            tone="dark"
            onClick={() => {
              saveApiKey(key)
              setKey(key.trim())
            }}
            className="rounded-xl py-2.5 text-[11px] font-extrabold"
          >
            Save key
          </Button>
        </div>
      </Well>

      <Well className="flex flex-col gap-2 px-4 py-3">
        <Eyebrow>Discipline dial</Eyebrow>
        <DifficultyDial />
      </Well>

      <Well className="flex flex-col gap-2.5 px-4 py-3">
        <Eyebrow>Data and backups</Eyebrow>
        <div className="grid grid-cols-2 gap-2">
          <Button
            tone="card"
            data-testid="export-backup"
            onClick={exportBackup}
            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-extrabold"
          >
            <DownloadIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
            Export
          </Button>
          <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-extrabold text-ink depth-card">
            <UploadIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
            Import
            <input
              data-testid="import-backup"
              type="file"
              accept="application/json,.json,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                void importBackup(file).then((ok) => {
                  if (ok) onClose()
                })
              }}
            />
          </label>
        </div>
      </Well>

      <Well className="flex flex-col gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setFormulasOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={formulasOpen}
        >
          <span className="text-xs font-extrabold tracking-tight text-ink">Formulas</span>
          <ChevronIcon className="text-muted" up={formulasOpen} />
        </button>
        {formulasOpen && <EconomyRules />}
      </Well>

      <Well className="flex flex-col gap-3 px-4 py-3">
        <Eyebrow>Developer</Eyebrow>
        <SettingRow label="Demo mode">
          <ToggleButton testId="demo-mode" label="Toggle demo mode" onClick={toggleDemo} muted={!demoMode}>
            {demoMode ? 'On' : 'Off'}
          </ToggleButton>
        </SettingRow>
        {freshArmed ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              tone="card"
              onClick={() => setFreshArmed(false)}
              className="rounded-xl py-2.5 text-[11px] font-extrabold"
            >
              Cancel
            </Button>
            <Button
              tone="dark"
              data-testid="confirm-fresh"
              onClick={() => {
                startFresh()
                onClose()
              }}
              className="rounded-xl py-2.5 text-[11px] font-extrabold"
            >
              Start fresh
            </Button>
          </div>
        ) : (
          <Button
            tone="card"
            data-testid="start-fresh"
            onClick={() => {
              feedback('click')
              setFreshArmed(true)
            }}
            className="rounded-xl py-2.5 text-[11px] font-extrabold pts-spend"
          >
            Start fresh
          </Button>
        )}
      </Well>
      <p data-testid="build-indicator" className="text-center font-num text-[10px] font-bold tracking-wide text-faint">
        Altius {RELEASE_LABEL}
      </p>
    </ModalSheet>
  )
}

function SettingRow({
  icon,
  label,
  children,
}: {
  readonly icon?: ReactNode
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs font-extrabold tracking-tight text-ink">
        {icon}
        {label}
      </span>
      {children}
    </div>
  )
}

function ToggleButton({
  testId,
  label,
  onClick,
  muted = false,
  children,
}: {
  readonly testId: string
  readonly label: string
  readonly onClick: () => void
  readonly muted?: boolean
  readonly children: ReactNode
}) {
  return (
    <Button
      tone="card"
      data-testid={testId}
      aria-label={label}
      onClick={onClick}
      className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black ${muted ? 'text-muted' : 'text-ink'}`}
    >
      {children}
    </Button>
  )
}

function EconomyRules() {
  return (
    <div className="flex flex-col gap-3.5 pt-2.5 border-t border-line text-[11px] leading-relaxed text-body">
      <section className="flex flex-col gap-1.5">
        <RuleTitle>1. Action Points</RuleTitle>
        <p>Gemini rates the log. Points are that rating times (duration / 45)<sup>0.45</sup>. Foundation decks share a 60–85 point pool by strain, relevance, and weight.</p>
        <ul className="flex flex-col gap-1">
          <li className="flex items-center justify-between gap-2"><span className="font-bold text-muted">Strain</span><span className="font-num font-extrabold text-ink">60 / 40 / 20</span></li>
          <li className="flex items-center justify-between gap-2"><span className="font-bold text-muted">Relevance</span><span className="font-num font-extrabold text-ink">1 / 0.75 / 0.5</span></li>
          <li className="flex items-center justify-between gap-2"><span className="font-bold text-muted">Weight</span><span className="font-num font-extrabold text-ink">2 / 1.5 / 1</span></li>
        </ul>
        <p>
          Default anchor: <span className="font-extrabold text-ink">Your main goal</span>
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <RuleTitle>2. Manual Vault Rules</RuleTitle>
        <Rule>
          <Tag chip="chip-violet">Time</Tag>
          <p>Gaming. Minutes divided by 60, times the dial.</p>
          <p><Figure tone="spend">80 / 120 / 160 PTS per hour</Figure></p>
        </Rule>
        <Rule>
          <Tag chip="chip-sky">Money</Tag>
          <p>Food/Drink, Items, and Events. Dollars times the dial.</p>
          <p><Figure tone="spend">12 / 20 / 30 PTS per dollar</Figure></p>
        </Rule>
        <p>
          <span className="pts-spend font-extrabold">Spend now</span>
          {' uses these same prices and removes the points immediately.'}
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <RuleTitle>3. Point Sink / Anti-Inflation</RuleTitle>
        <Stat label="Output baseline" value="120 PTS" tone="earn" />
        <Stat label="Grace floor" value="50% of target" tone="earn" />
        <Stat label="Decay fee" value="−15 / −20 PTS" tone="spend" />
        <p>The output target is the median judged day of the last 7 active days, held between 80 and 180. A day at the target grows the output streak. The grace band holds it. Under the grace floor resets it. Tier 2 and above charges 20 points. Judged logs are not multiplied by a streak.</p>
      </section>
    </div>
  )
}

function RuleTitle({ children }: { readonly children: string }) {
  return <p className="text-[11px] font-extrabold tracking-tight text-ink">{children}</p>
}

function Rule({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-col gap-1 rounded-xl bg-card border border-line px-2.5 py-2">{children}</div>
}

function Tag({ chip, children }: { readonly chip: string; readonly children: string }) {
  return (
    <span className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold leading-none ${chip}`}>
      {children}
    </span>
  )
}

function Figure({ tone = 'ink', children }: { readonly tone?: 'ink' | 'earn' | 'spend'; readonly children: ReactNode }) {
  const color = tone === 'earn' ? 'pts-earn' : tone === 'spend' ? 'pts-spend' : 'text-ink'
  return <span className={`font-num font-bold ${color}`}>{children}</span>
}

function Stat({ label, value, tone }: { readonly label: string; readonly value: string; readonly tone: 'earn' | 'spend' }) {
  const color = tone === 'earn' ? 'pts-earn' : 'pts-spend'
  return (
    <p className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={`font-num font-extrabold ${color}`}>{value}</span>
    </p>
  )
}
