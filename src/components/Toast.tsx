import { TOAST_MS, useNotice } from '../hooks/useNotice'
import { CloseIcon } from './Icons'

type NoticeTone = 'earn' | 'spend' | 'neutral'

function noticeTone(message: string): NoticeTone {
  if (/Returned\s+\d/.test(message) || /(^|[^\d])\+\d/.test(message)) return 'earn'
  if (/-\d/.test(message) || /Need\s+\d+\s+more PTS/.test(message) || /Decay/i.test(message)) return 'spend'
  return 'neutral'
}

function NoticeText({ text, tone }: { readonly text: string; readonly tone: NoticeTone }) {
  const bits = text.split(/([+-]?\d+(?:\.\d+)?\s*PTS)/)
  return bits.map((bit, index) => {
    if (!/^[+-]?\d+(?:\.\d+)?\s*PTS$/.test(bit)) return bit
    const signed = bit.startsWith('-') ? 'spend' : bit.startsWith('+') ? 'earn' : tone
    const color = signed === 'earn' ? 'pts-earn' : signed === 'spend' ? 'pts-spend' : 'text-ink'
    return (
      <span key={index} className={`font-num font-extrabold ${color}`}>
        {bit}
      </span>
    )
  })
}

export function Toast() {
  const { toast, dismiss } = useNotice()
  if (!toast) return null
  const tone = noticeTone(toast)
  const rail = tone === 'earn' ? 'notice-rail-earn' : tone === 'spend' ? 'notice-rail-spend' : 'bg-ink'
  const life = tone === 'earn' ? 'notice-rail-earn' : tone === 'spend' ? 'notice-rail-spend' : 'bg-ink/35'

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[80] flex justify-center px-4"
      style={{ top: 'calc(0.75rem + env(safe-area-inset-top))' }}
    >
      <div
        key={toast}
        role="status"
        className="notice-pop depth-card alert-in pointer-events-auto relative w-full max-w-[430px] overflow-hidden rounded-[22px]"
      >
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className={`h-8 w-1 shrink-0 rounded-full ${rail}`} aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-ink">
            <NoticeText text={toast} tone={tone} />
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="press focus-ring -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted"
            aria-label="Dismiss notification"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <span
          className={`notice-life absolute inset-x-0 bottom-0 h-0.5 origin-left ${life}`}
          style={{ animationDuration: `${TOAST_MS}ms` }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
