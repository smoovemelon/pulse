import { useEffect, useState, type ReactNode } from 'react'
import { RELEASE_LABEL } from '../../release'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { Button } from '../Common/Button'
import { DifficultyDial } from '../Common/DifficultyDial'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'
import { Well } from '../Common/primitives'
import { CheckIcon, ChevronIcon, DownloadIcon, UploadIcon } from '../Icons'

export function SettingsModal({ onClose }: { readonly onClose: () => void }) {
  const { saveApiKey, checkKey, apiKey, keyBadge, keyBadgeClass, exportBackup, importBackup, startFresh, demoMode, toggleDemo, username, saveUsername } = useSettings()
  const { feedback } = useSensory()
  const [key, setKey] = useState(apiKey)
  const [name, setName] = useState(username)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const [freshArmed, setFreshArmed] = useState(false)

  useEffect(() => {
    void checkKey(apiKey)
  }, [apiKey, checkKey])

  return (
    <ModalSheet labelledBy="settings-heading" className="max-h-[88vh]" onDismiss={onClose}>
      <div className="flex justify-between items-center">
        <div>
          <span className="eyebrow block mb-0.5">Preferences</span>
          <h3 id="settings-heading" className="text-base heading-athletic text-ink">Settings</h3>
        </div>
        <div className="flex items-center gap-2">
          <span data-testid="version-stamp" className="font-num text-[10px] font-extrabold tracking-wide text-faint">
            {RELEASE_LABEL}
          </span>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="display-name" className="eyebrow eyebrow-muted">
          Display Name
        </label>
        <input
          id="display-name"
          data-testid="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. adrinn"
          className="field w-full rounded-2xl p-3.5 text-xs font-bold"
          autoComplete="nickname"
        />
        <Button
          tone="dark"
          data-testid="save-display-name"
          disabled={!name.trim() || name.trim() === username}
          onClick={() => saveUsername(name)}
          className="action-btn disabled:opacity-40"
        >
          Save name
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center gap-2">
          <label htmlFor="api-key" className="eyebrow eyebrow-muted">
            Gemini API Key
          </label>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${keyBadgeClass}`}>{keyBadge}</span>
        </div>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="Paste Google AI Studio Key"
          className="field w-full rounded-2xl p-3.5 text-xs font-mono"
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          tone="card"
          onClick={() => {
            feedback('click')
            void checkKey(key)
          }}
          className="py-3.5 rounded-2xl text-xs font-extrabold active:scale-95 flex items-center justify-center gap-1.5"
        >
          <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
          Test Key Ping
        </Button>
        <Button
          tone="dark"
          onClick={() => {
            saveApiKey(key)
            setKey(key.trim())
          }}
          className="action-btn"
        >
          Save Key
        </Button>
      </div>

      <Well className="flex flex-col gap-2 p-4">
        <span className="eyebrow eyebrow-muted">Discipline dial</span>
        <DifficultyDial />
      </Well>

      <div className="depth-well rounded-2xl p-4 flex flex-col gap-2.5">
        <span className="eyebrow eyebrow-muted block">Data & Backups</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            tone="card"
            data-testid="export-backup"
            onClick={exportBackup}
            className="py-2.5 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95"
          >
            <DownloadIcon className="w-3.5 h-3.5 shrink-0 text-muted" />
            Export Backup
          </Button>
          <label className="py-2.5 px-3 rounded-xl depth-card text-ink text-[11px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer">
            <UploadIcon className="w-3.5 h-3.5 shrink-0 text-muted" />
            Import Backup
            <input
              data-testid="import-backup"
              type="file"
              accept=".json"
              className="hidden"
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
      </div>

      <div className="depth-well rounded-2xl px-4 py-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setFormulasOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-xs font-extrabold tracking-tight text-ink leading-tight">Economic Formulas & Rules</span>
          <ChevronIcon className="text-muted" up={formulasOpen} />
        </button>
        {formulasOpen && <EconomyRules />}
      </div>
      <Well className="flex flex-col gap-3 px-4 py-3">
        <span className="eyebrow eyebrow-muted">Developer</span>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold tracking-tight text-ink">Demo mode</span>
          <Button
            tone="card"
            data-testid="demo-mode"
            onClick={toggleDemo}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black ${
              demoMode ? 'text-emerald-700 border-emerald-200' : 'text-muted'
            }`}
          >
            {demoMode ? 'On' : 'Off'}
          </Button>
        </div>
        {freshArmed ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              tone="card"
              onClick={() => setFreshArmed(false)}
              className="py-2.5 rounded-xl text-[11px] font-extrabold active:scale-95"
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
              className="py-2.5 rounded-xl text-[11px] font-extrabold active:scale-95"
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
            className="py-2.5 rounded-xl text-[11px] font-extrabold text-body active:scale-95"
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

function EconomyRules() {
  return (
    <div className="flex flex-col gap-3.5 pt-2.5 border-t border-line text-[11px] leading-relaxed text-body">
      <section className="flex flex-col gap-1.5">
        <RuleTitle>1. Action Points</RuleTitle>
        <p>
          Base = <Figure tone="earn">Strain (1–10) × 8 × (Duration / 45)<sup>0.45</sup></Figure>
        </p>
        <p>Gemini rates the log. The app multiplies those ratings. Foundation decks pay a flat share of a 60–85 point pool.</p>
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
          <span className="font-extrabold text-rose-600 dark:text-rose-300">Spend now</span>
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
  const color = tone === 'earn'
    ? 'text-emerald-700 dark:text-emerald-300'
    : tone === 'spend'
      ? 'text-rose-600 dark:text-rose-300'
      : 'text-ink'
  return <span className={`font-num font-bold ${color}`}>{children}</span>
}

function Stat({ label, value, tone }: { readonly label: string; readonly value: string; readonly tone: 'earn' | 'spend' }) {
  const color = tone === 'earn' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
  return (
    <p className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={`font-num font-extrabold ${color}`}>{value}</span>
    </p>
  )
}
