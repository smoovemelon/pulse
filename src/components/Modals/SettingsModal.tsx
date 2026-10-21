import { useEffect, useState, type ReactNode } from 'react'
import { RELEASE_LABEL } from '../../release'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { Button } from '../Common/Button'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'
import { CheckIcon, ChevronIcon, DownloadIcon, UploadIcon } from '../Icons'

export function SettingsModal({ onClose }: { readonly onClose: () => void }) {
  const { saveApiKey, checkKey, apiKey, keyBadge, keyBadgeClass, exportBackup, importBackup, startFresh } = useSettings()
  const { decayEnabled, toggleDecay, runAudit } = usePulseEconomy()
  const { feedback } = useSensory()
  const [key, setKey] = useState(apiKey)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const [freshArmed, setFreshArmed] = useState(false)

  useEffect(() => {
    setKey(apiKey)
    void checkKey(apiKey)
  }, [apiKey, checkKey])

  return (
    <ModalSheet labelledBy="settings-heading" className="max-h-[88vh]">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block mb-0.5">Preferences</span>
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
        <div className="flex justify-between items-center gap-2">
          <label htmlFor="api-key" className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
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
          className="field w-full rounded-2xl p-3.5 text-xs font-mono focus:outline-none"
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
        <Button tone="dark" onClick={() => saveApiKey(key)} className="action-btn">
          Save Key
        </Button>
      </div>

      <div className="depth-well rounded-2xl p-4 flex flex-col gap-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted block">Backup</span>
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
              accept=".json,application/json"
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

      <div className="depth-well rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold tracking-tight text-ink block">Discipline Decay</span>
            <span className="text-[10px] text-muted">-15 PTS tax if daily target isn't met</span>
          </div>
          <Button
            tone="card"
            onClick={toggleDecay}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
              decayEnabled ? 'text-emerald-700 border-emerald-200' : 'text-muted'
            }`}
          >
            {decayEnabled ? 'Active' : 'Disabled'}
          </Button>
        </div>
        <Button
          tone="card"
          data-testid="manual-audit"
          onClick={() => {
            feedback('click')
            runAudit(true)
          }}
          className="mt-1 py-2 rounded-xl text-body text-[11px] font-bold text-center active:scale-95"
        >
          Run Midnight Audit Check Now
        </Button>
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
      <div className="depth-well rounded-2xl px-4 py-3 flex flex-col gap-2">
        <div>
          <span className="text-xs font-extrabold tracking-tight text-ink block">Developer</span>
          <span className="text-[10px] text-muted">Start over as a new user. This clears the balance, ledger, and vault on this device.</span>
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
      </div>
      <p data-testid="build-indicator" className="text-center font-num text-[10px] font-bold tracking-wide text-faint">
        Altius {RELEASE_LABEL}
      </p>
    </ModalSheet>
  )
}

const ALIGNMENT = [
  { threshold: '≥ 8.0', multiplier: '2.0×', name: 'Heavyweight', chip: 'chip-emerald' },
  { threshold: '≥ 4.0', multiplier: '1.5×', name: 'Cruiserweight', chip: 'chip-indigo' },
  { threshold: '< 4.0', multiplier: '1.0×', name: 'Middleweight', chip: 'chip-zinc' },
] as const

function EconomyRules() {
  return (
    <div className="flex flex-col gap-3.5 pt-2.5 border-t border-line text-[11px] leading-relaxed text-body">
      <section className="flex flex-col gap-1.5">
        <RuleTitle>1. Action Points</RuleTitle>
        <p>
          Base = <Figure tone="earn">Strain (1–10) × 8 × (Duration / 45)<sup>0.45</sup></Figure>
        </p>
        <p>Anchor alignment multiplies that base.</p>
        <ul className="flex flex-col gap-1">
          {ALIGNMENT.map((tier) => (
            <li key={tier.name} className="flex items-center justify-between gap-2">
              <span className="font-num font-bold text-muted">{tier.threshold}</span>
              <span className="flex items-center gap-2">
                <Tag chip={tier.chip}>{tier.name}</Tag>
                <span className="font-num font-extrabold text-ink w-8 text-right">{tier.multiplier}</span>
              </span>
            </li>
          ))}
        </ul>
        <p>
          Default anchor: <span className="font-extrabold text-ink">Your main goal</span>
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <RuleTitle>2. Manual Vault Rules</RuleTitle>
        <Rule>
          <Tag chip="chip-violet">Gaming</Tag>
          <p>Time only. Price locked at <Figure>$0</Figure>. Duration must be above 0.</p>
          <p><Figure tone="spend">Hours × 50 PTS</Figure></p>
        </Rule>
        <Rule>
          <Tag chip="chip-sky">Items</Tag>
          <p>Price only. Duration locked at <Figure>0</Figure> hrs. Price must be above $0.</p>
          <p><Figure tone="spend">USD × 20 PTS</Figure></p>
        </Rule>
        <Rule>
          <span className="flex flex-wrap gap-1">
            <Tag chip="chip-amber">Dining</Tag>
            <Tag chip="chip-emerald">Events</Tag>
          </span>
          <p>Duration is required. Price is optional.</p>
          <p>
            <Figure tone="spend">(USD × 20) + (hours × 35)</Figure>
            {' when price is above $0.'}
          </p>
          <p>
            <Figure tone="spend">Hours × 50 PTS</Figure>
            {' when price is $0.'}
          </p>
          <p>
            A timed bounty floors at <Figure tone="spend">25 PTS</Figure>.
          </p>
        </Rule>
        <p>
          <span className="font-extrabold text-rose-600 dark:text-rose-300">Spend now</span>
          {' uses these same prices and removes the points immediately.'}
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <RuleTitle>3. Point Sink / Anti-Inflation</RuleTitle>
        <Stat label="Daily target" value="120 PTS" tone="earn" />
        <Stat label="Decay fee" value="−15 PTS" tone="spend" />
        <p>If earned momentum is below target at the date rollover, the decay fee applies once.</p>
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
