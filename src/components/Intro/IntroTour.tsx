import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { pushEntry } from '../../lib/backStack'
import { markIntroSeen } from '../../services/persistence'
import { Button } from '../Common/Button'
import { AnchorIcon, FlameIcon, PlusIcon, VaultIcon } from '../Icons'

const STEPS: readonly { readonly kicker: string; readonly title: string; readonly body: string; readonly mark: ReactNode }[] = [
  {
    kicker: 'Get started',
    title: 'Points for the work',
    body: 'Altius keeps a balance of what you earn and what you spend. Work adds points. Rewards take them back.',
    mark: <Wordmark />,
  },
  {
    kicker: 'First move',
    title: 'Name the anchor',
    body: 'Set a discipline anchor before you log anything. Gemini rates relevance, strain, and weight. The app multiplies those ratings into points. Habit decks pay a flat bounty and have to be finished in order.',
    mark: <MarkTile><AnchorIcon className="h-5 w-5" /></MarkTile>,
  },
  {
    kicker: 'Earn',
    title: 'Log it with plus',
    body: 'Tap the plus button, describe what you did, and set how long it took. The score lands on your discipline balance and in the feed.',
    mark: <MarkTile><PlusIcon className="h-5 w-5" /></MarkTile>,
  },
  {
    kicker: 'Daily line',
    title: 'Fill the capsule',
    body: 'The left meter is forge points against today’s target. The right meter is how many of the three decks are finished.',
    mark: <GoalMark />,
  },
  {
    kicker: 'Streak',
    title: 'Hold the line',
    body: 'The forge streak grows when the day hits its target, holds in the grace band, and resets under half. The chain streak grows when all three decks are finished. Streaks change prices and protections. They do not multiply points.',
    mark: <StreakMark />,
  },
  {
    kicker: 'Spend',
    title: 'Park a bounty',
    body: 'The vault prices time and money from the discipline dial. Balanced is 120 points an hour and 20 points a dollar. Lenient is cheaper. Hardcore costs more. The weaker streak sets the discount.',
    mark: <MarkTile><VaultIcon className="h-5 w-5" /></MarkTile>,
  },
  {
    kicker: 'Ready',
    title: 'Start with the anchor',
    body: 'Name the goal, log one action, and keep the streak under the balance. The question mark in the header opens this guide again.',
    mark: <MarkTile><FlameIcon className="h-[18px] w-[18px]" /></MarkTile>,
  },
]

function Wordmark() {
  return <span className="heading-athletic text-2xl tracking-tighter text-ink">ALTIUS</span>
}

function MarkTile({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-canvas">
      {children}
    </div>
  )
}

function StreakMark() {
  const marks = ['bg-ink', 'bg-ink', 'border border-ink', 'border border-line', 'border border-line']
  return (
    <div className="flex items-end gap-1.5" aria-hidden="true">
      {marks.map((tone, index) => (
        <span key={tone + index} className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-faint">{'MTWTF'[index]}</span>
          <span className={`h-1.5 w-4 rounded-full ${tone}`} />
        </span>
      ))}
    </div>
  )
}

function GoalMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-14 w-14" aria-hidden="true">
      <circle cx="24" cy="24" r="16" className="momentum-track" fill="none" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r="16"
        className="momentum-progress intro-arc"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IntroTour({ onClose }: { readonly onClose: () => void }) {
  const { economy, saveDifficulty } = useSettings()
  const [step, setStep] = useState(0)
  const stepRef = useRef(0)
  const releases = useRef<Array<() => void>>([])
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const current = STEPS[step]
  const last = step === STEPS.length - 1

  const finish = () => {
    markIntroSeen()
    onCloseRef.current()
  }

  useEffect(() => {
    let cancel = false
    let release: (() => void) | null = null
    queueMicrotask(() => {
      if (cancel) return
      release = pushEntry(() => {
        markIntroSeen()
        onCloseRef.current()
      })
    })
    return () => {
      cancel = true
      while (releases.current.length > 0) releases.current.pop()?.()
      release?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      markIntroSeen()
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const advance = () => {
    const leaving = stepRef.current
    const release = pushEntry(() => {
      stepRef.current = leaving
      setStep(leaving)
    })
    releases.current.push(release)
    const next = leaving + 1
    stepRef.current = next
    setStep(next)
  }

  return (
    <div
      data-testid="sheet-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-heading"
      onClick={(event) => {
        if (event.target === event.currentTarget) finish()
      }}
    >
      <div className="flex w-full max-w-[360px] animate-slide-up flex-col gap-5 rounded-[32px] border border-line bg-card p-6 text-ink shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="font-num text-[10px] font-extrabold tracking-widest text-faint">
            {step + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            data-testid="intro-skip"
            onClick={finish}
            className="text-[11px] font-extrabold uppercase tracking-wider text-muted active:scale-95"
          >
            Skip
          </button>
        </div>

        <div key={step} className="intro-step flex min-h-[220px] flex-col items-center gap-4 text-center">
          <div className="flex h-16 items-center justify-center">{current.mark}</div>
          <div>
            <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-faint">{current.kicker}</span>
            <h3 id="intro-heading" className="heading-athletic text-xl text-ink">{current.title}</h3>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-body">{current.body}</p>
          {current.title === 'Park a bounty' && (
            <div className="grid w-full grid-cols-3 gap-2">
              {(['lenient', 'balanced', 'hardcore'] as const).map((level) => (
                <Button
                  key={level}
                  tone={economy.difficulty === level ? 'pillActive' : 'pill'}
                  onClick={() => saveDifficulty(level)}
                  className="rounded-xl py-2 text-[10px] font-extrabold uppercase"
                >
                  {level}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === step ? 'w-5 bg-ink' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button
              tone="card"
              data-testid="intro-back"
              onClick={() => history.back()}
              className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold active:scale-95"
            >
              Back
            </Button>
          )}
          <Button
            tone="dark"
            data-testid="intro-next"
            onClick={() => {
              if (last) finish()
              else advance()
            }}
            className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold uppercase tracking-wider active:scale-95"
          >
            {last ? 'Get started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
