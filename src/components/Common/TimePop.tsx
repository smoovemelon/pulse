import { useRef, useState } from 'react'
import { Button } from './Button'

const STEP = 15
const MAX = 23 * 60 + 45

function minutesOf(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return 13 * 60
  return Number(match[1]) * 60 + Number(match[2])
}

function snap(minutes: number) {
  return Math.min(MAX, Math.max(0, Math.round(minutes / STEP) * STEP))
}

function clock(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function spoken(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12
  return `${hour}:${String(mins).padStart(2, '0')} ${suffix}`
}

export function TimePop({
  label,
  value,
  onChange,
}: {
  readonly label: string
  readonly value: string
  readonly onChange: (next: string) => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => snap(minutesOf(value)))
  const [top, setTop] = useState(80)
  const percent = (draft / MAX) * 100

  const show = () => {
    const next = snap(minutesOf(value))
    setDraft(next)
    const rect = buttonRef.current?.getBoundingClientRect()
    const panel = 220
    if (rect && rect.top > panel + 16) setTop(rect.top - panel - 8)
    else if (rect) setTop(Math.min(rect.bottom + 8, window.innerHeight - panel - 12))
    setOpen(true)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={show}
        className="field press focus-ring w-full rounded-xl px-3 py-2 text-left"
      >
        <span className="block text-[10px] font-bold text-muted">{label}</span>
        <span className="font-num text-sm font-extrabold text-ink">{spoken(snap(minutesOf(value)))}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/30" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label={`${label} cutoff`}
            className="absolute left-1/2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[28px] border border-line bg-card p-4 text-ink shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)]"
            style={{ top }}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="eyebrow">{label}</span>
            <p className="mt-1 font-num text-3xl font-extrabold tracking-tight">{spoken(draft)}</p>
            <input
              type="range"
              min={0}
              max={MAX}
              step={STEP}
              value={draft}
              aria-label="Cutoff time"
              aria-valuetext={spoken(draft)}
              onChange={(event) => setDraft(snap(Number(event.target.value)))}
              className="time-slider mt-4"
              style={{ background: `linear-gradient(90deg, var(--ink) ${percent}%, var(--line) ${percent}%)` }}
            />
            <div className="mt-1 flex justify-between font-num text-[10px] font-bold text-faint">
              <span>12:00 AM</span>
              <span>11:45 PM</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button tone="card" onClick={() => setOpen(false)} className="rounded-xl py-2.5 text-[11px] font-extrabold">
                Cancel
              </Button>
              <Button
                tone="dark"
                onClick={() => {
                  onChange(clock(draft))
                  setOpen(false)
                }}
                className="rounded-xl py-2.5 text-[11px] font-extrabold"
              >
                Set
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
