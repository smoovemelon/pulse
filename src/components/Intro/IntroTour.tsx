import { useEffect, useRef, useState } from 'react'
import { pushEntry } from '../../lib/backStack'
import { markIntroSeen } from '../../services/persistence'
import { Button } from '../Common/Button'
import { DifficultyDial } from '../Common/DifficultyDial'
import { Eyebrow } from '../Common/primitives'

type TourTarget = 'balance' | 'day' | 'foundation' | 'log' | 'vault'

const STEPS: readonly {
  readonly kicker: string
  readonly title: string
  readonly body: string
  readonly target?: TourTarget
  readonly dial?: boolean
}[] = [
  {
    kicker: 'Get started',
    title: 'Points for the work',
    body: 'Altius keeps a balance of what you earn and what you spend. Work adds points. Rewards take them back.',
  },
  {
    kicker: 'Balance',
    title: 'Anchor and balance',
    body: 'This card holds the discipline balance and the anchor. Name the anchor before you log. Gemini rates relevance, strain, and weight, and the app turns those ratings into points.',
    target: 'balance',
  },
  {
    kicker: 'Today',
    title: 'One day card',
    body: 'Forge fills left from the center of the pill, toward today’s target. Foundation fills right as the three decks finish. The week marks and the discount sit on this card. Forge grows at the target, holds from half up, and resets under half. Foundation grows when every deck is done. Streaks change prices. They do not multiply points.',
    target: 'day',
  },
  {
    kicker: 'Decks',
    title: 'Open Foundation',
    body: 'The decks live on their own tab. Finish habits in order. Edit names and cutoff times there. Use PTO asks you to confirm, then spends a banked token. Habit bounties are flat and stay separate from judged logs.',
    target: 'foundation',
  },
  {
    kicker: 'Earn',
    title: 'Log it with plus',
    body: 'Plus opens a log. Describe the work and set how long it took. The score lands on the balance and in the ledger.',
    target: 'log',
  },
  {
    kicker: 'Spend',
    title: 'Park a bounty',
    body: 'The vault prices time and money from the discipline dial. Balanced is 120 points an hour and 20 points a dollar. Lenient is cheaper. Hardcore costs more. The weaker streak sets the discount.',
    target: 'vault',
    dial: true,
  },
  {
    kicker: 'Ready',
    title: 'Start with the anchor',
    body: 'Name the goal on the balance card, log one action, and keep the day card in view. The question mark in the header opens this guide again.',
  },
]

type Spot = { readonly top: number; readonly left: number; readonly width: number; readonly height: number; readonly radius: number }

function spotFor(target: TourTarget, maxHeight: number): Spot | null {
  const node = document.querySelector(`[data-tour="${target}"]`)
  if (!node) return null
  const rect = node.getBoundingClientRect()
  const radius = target === 'log' ? 999 : target === 'vault' || target === 'foundation' ? 20 : 32
  return { top: rect.top, left: rect.left, width: rect.width, height: Math.min(rect.height, maxHeight), radius }
}

export function IntroTour({ onClose }: { readonly onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [spot, setSpot] = useState<Spot | null>(null)
  const stepRef = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const releases = useRef<Array<() => void>>([])
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const current = STEPS[step]
  const last = step === STEPS.length - 1

  const finish = () => {
    markIntroSeen()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
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

  useEffect(() => {
    const target = STEPS[step].target
    if (!target) {
      setSpot(null)
      return
    }
    const dock = target === 'log' || target === 'vault' || target === 'foundation'
    let frame = 0
    const measure = (allowScroll: boolean) => {
      const node = document.querySelector(`[data-tour="${target}"]`)
      if (!node) {
        setSpot(null)
        return
      }
      const cardH = cardRef.current?.offsetHeight ?? 300
      if (allowScroll && !dock) {
        const top = node.getBoundingClientRect().top
        if (Math.abs(top - 16) > 8) {
          const before = window.scrollY
          window.scrollBy({ top: top - 16, behavior: 'auto' })
          if (window.scrollY !== before) return
        }
      }
      const rect = node.getBoundingClientRect()
      const room = dock ? rect.height : Math.max(96, window.innerHeight - cardH - 28 - Math.max(rect.top, 0))
      setSpot(spotFor(target, room))
    }
    measure(true)
    const wait = window.setTimeout(() => measure(true), 40)
    const onMove = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => measure(false))
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    const observer = new ResizeObserver(onMove)
    if (cardRef.current) observer.observe(cardRef.current)
    return () => {
      window.clearTimeout(wait)
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [step])

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

  const width = Math.min(360, typeof window === 'undefined' ? 360 : window.innerWidth - 32)
  const cardTop = (() => {
    if (!spot) return null
    const cardH = cardRef.current?.offsetHeight ?? 300
    const dock = current.target === 'log' || current.target === 'vault' || current.target === 'foundation'
    if (dock) return Math.max(8, spot.top - cardH - 12)
    return Math.max(8, window.innerHeight - cardH - 8)
  })()

  return (
    <div
      data-testid="sheet-backdrop"
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-heading"
      onClick={(event) => {
        if (event.target === event.currentTarget) finish()
      }}
    >
      {spot ? (
        <div
          data-testid="intro-spot"
          aria-hidden="true"
          className="pointer-events-none absolute ring-2 ring-white/90"
          style={{
            top: spot.top - 6,
            left: spot.left - 6,
            width: spot.width + 12,
            height: spot.height + 12,
            borderRadius: spot.radius,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.5)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={finish} />
      )}

      <div
        ref={cardRef}
        className="absolute flex w-full flex-col gap-5 rounded-[32px] border border-line bg-card p-6 text-ink shadow-2xl"
        style={
          cardTop === null
            ? { top: '50%', left: '50%', width, transform: 'translate(-50%, -50%)' }
            : { top: cardTop, left: '50%', width, transform: 'translateX(-50%)', maxHeight: 'calc(100dvh - 24px)' }
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-num text-[10px] font-extrabold tracking-widest text-faint">
            {step + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            data-testid="intro-skip"
            onClick={finish}
            className="press focus-ring text-[11px] font-extrabold uppercase tracking-wider text-muted"
          >
            Skip
          </button>
        </div>

        <div key={step} className="intro-step flex flex-col items-center gap-4 overflow-y-auto text-center sheet-scroll">
          {current.target === undefined && (
            <div className="flex h-16 items-center justify-center">
              <span className="heading-athletic text-2xl tracking-tighter text-ink">ALTIUS</span>
            </div>
          )}
          <div>
            <Eyebrow className="mb-1 block">{current.kicker}</Eyebrow>
            <h3 id="intro-heading" className="heading-athletic text-xl text-ink">{current.title}</h3>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-body">{current.body}</p>
          {current.dial && <DifficultyDial />}
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
              className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold"
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
            className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold uppercase tracking-wider"
          >
            {last ? 'Get started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
