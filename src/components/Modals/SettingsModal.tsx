import { useEffect, useState } from 'react'
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
        <h3 id="settings-heading" className="text-base font-black tracking-tight text-ink">Settings & Economy</h3>
        <div className="flex items-center gap-2">
          <span data-testid="version-stamp" className="font-num text-[10px] font-extrabold tracking-wide text-faint">
            {RELEASE_LABEL}
          </span>
          <CloseButton onClick={onClose} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center gap-2">
          <label htmlFor="api-key" className="text-[11px] font-black uppercase tracking-wider text-muted">
            Gemini API Key (Action Judgments)
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
          className="py-3 rounded-2xl text-xs font-black active:scale-95 flex items-center justify-center gap-1.5"
        >
          <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
          Test Key Ping
        </Button>
        <Button tone="dark" onClick={() => saveApiKey(key)} className="py-3 rounded-2xl text-xs font-black active:scale-95">
          Save Key
        </Button>
      </div>

      <div className="depth-well rounded-2xl p-4 flex flex-col gap-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted block">Data Protection & Device Sync</span>
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
            <span className="text-xs font-black text-ink block">Discipline Decay (Anti-Inflation)</span>
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
          <span className="text-xs font-black text-ink leading-tight">Economic Formulas & Rules</span>
          <ChevronIcon className="text-muted" up={formulasOpen} />
        </button>
        {formulasOpen && (
          <div className="flex flex-col gap-2.5 text-xs text-body pt-2 border-t border-line">
            <div>
              <strong className="text-ink block mb-0.5">1. Action Points</strong>
              <p className="text-[11px] leading-relaxed">
                Base = Strain (1–10) × 8 × (Duration / 45)<sup>0.45</sup>.
                <br />
                Multipliers: Alignment ≥ 8.0 (2.0x Heavyweight), ≥ 4.0 (1.5x Cruiserweight), &lt; 4.0 (1.0x Middleweight).
                Default anchor: Your main goal.
              </p>
            </div>
            <div>
              <strong className="text-ink block mb-0.5">2. Manual Vault Rules</strong>
              <p className="text-[11px] leading-relaxed">
                <strong>Gaming:</strong> time only, price locked at $0. Hours × 50 PTS. Duration must be above 0.
                <br />
                <strong>Items:</strong> price only, duration locked at 0. USD × 20 PTS. Price must be above $0.
                <br />
                <strong>Dining & Events:</strong> duration is required. (USD × 20) + (hours × 35), or hours × 50 when price is $0. A timed bounty floors at 25 PTS.
              </p>
            </div>
            <div>
              <strong className="text-ink block mb-0.5">3. Point Sink / Anti-Inflation</strong>
              <p className="text-[11px] leading-relaxed">
                Daily target: 120 PTS. If earned momentum is below target at the date rollover, a 15 PTS decay fee enforces accountability.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="depth-well rounded-2xl px-4 py-3 flex flex-col gap-2">
        <div>
          <span className="text-xs font-black text-ink block">Developer</span>
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
        Pulse {RELEASE_LABEL}
      </p>
    </ModalSheet>
  )
}
