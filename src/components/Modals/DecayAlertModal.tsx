import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { Button } from '../Common/Button'
import { AlertIcon } from '../Icons'

export function DecayAlertModal() {
  const { decayAlert, dismissDecay, dailyGoal } = usePulseEconomy()
  if (!decayAlert) return null

  return (
    <div
      data-testid="sheet-backdrop"
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decay-heading"
      onClick={(event) => {
        if (event.target === event.currentTarget) dismissDecay()
      }}
    >
      <div className="w-full max-w-[360px] bg-card text-ink rounded-[32px] p-6 border border-line shadow-2xl flex flex-col gap-4 animate-slide-up text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl chip-rose border flex items-center justify-center">
          <AlertIcon className="w-6 h-6" />
        </div>
        <div>
          <span className="eyebrow block mb-1">Decay</span>
          <h3 id="decay-heading" className="text-lg heading-athletic">Midnight Decay Assessed</h3>
        </div>
        <div className="depth-well rounded-2xl p-4 flex flex-col gap-2 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-bold">Daily Momentum Target</span>
            <span className="font-num font-extrabold">{dailyGoal} PTS</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-bold">Checked Total</span>
            <span data-testid="decay-earned" className="font-num font-extrabold text-rose-600">{decayAlert.earned} PTS</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-line">
            <span className="font-extrabold">Accountability Penalty</span>
            <span className="font-num font-extrabold text-rose-600">-{decayAlert.penalty} PTS</span>
          </div>
        </div>
        <p className="text-[11px] text-muted leading-relaxed">
          The day closed under 60 PTS. The streak reset, and 15 points were removed.
        </p>
        <Button
          tone="dark"
          data-testid="dismiss-decay"
          onClick={dismissDecay}
          className="action-btn"
        >
          Acknowledge & Rebuild
        </Button>
      </div>
    </div>
  )
}
