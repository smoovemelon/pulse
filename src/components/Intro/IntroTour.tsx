import { useEffect, useRef, useState } from 'react'
import { isNamedAnchor } from '../../lib/dates'
import { pushEntry } from '../../lib/backStack'
import { useNotice } from '../../hooks/useNotice'
import { useSettings } from '../../hooks/useSettings'
import { markIntroSeen } from '../../services/persistence'
import { Button } from '../Common/Button'
import { Eyebrow } from '../Common/primitives'
import { ProfilePhoto } from '../Dashboard/ProfilePhoto'

export type TourTarget = 'balance' | 'day' | 'foundation' | 'log' | 'bounty'

const STEPS: readonly {
  readonly kicker: string
  readonly title: string
  readonly body: string
  readonly target?: TourTarget
  readonly requireAnchor?: boolean
  readonly requireAvatar?: boolean
}[] = [
  {
    kicker: 'Get started',
    title: 'Points for the work',
    body: 'Work adds points. Rewards spend them. The balance is what is left.',
  },
  {
    kicker: 'Balance',
    title: 'Anchor and balance',
    body: 'The top of this card is your balance and your photo. The anchor is the goal every log is scored against.',
    target: 'balance',
  },
  {
    kicker: 'Today',
    title: 'One day card',
    body: 'The bar fills left for today’s points and right for finished decks. Hit the target to grow Output. Finish all three decks to grow Foundation. The week sits underneath.',
    target: 'day',
  },
  {
    kicker: 'Decks',
    title: 'Open Foundation',
    body: 'Finish the three decks in order. Edit habits and cutoffs here. Habit points stay separate from a judged log.',
    target: 'foundation',
  },
  {
    kicker: 'Earn',
    title: 'Log it with plus',
    body: 'Describe the work, then pick the minutes or start a timer. The timer keeps running if you close the sheet. The score lands on the balance and in History.',
    target: 'log',
  },
  {
    kicker: 'Spend',
    title: 'Park a bounty',
    body: 'Add saves a reward for later. Spend uses points now. Prices follow the dial in Settings.',
    target: 'bounty',
  },
  {
    kicker: 'Photo',
    title: 'Add your photo',
    body: 'Choose a picture, then drag and zoom until the circle frames it.',
    target: 'balance',
    requireAvatar: true,
  },
  {
    kicker: 'Anchor',
    title: 'Name your anchor',
    body: 'Write the goal in your own words. Logs are scored against it. Set anchor saves it and closes the guide.',
    target: 'balance',
    requireAnchor: true,
  },
]

type Spot = { readonly top: number; readonly left: number; readonly width: number; readonly height: number; readonly radius: string }

const SPOT_PAD = 4

function rounded(cardRadius: number, atTop: boolean, atBottom: boolean): string {
  const outer = cardRadius + SPOT_PAD
  const inner = 16
  if (atTop && atBottom) return `${outer}px`
  if (atTop) return `${outer}px ${outer}px ${inner}px ${inner}px`
  if (atBottom) return `${inner}px ${inner}px ${outer}px ${outer}px`
  return `${inner}px`
}

function spotFor(target: TourTarget): Spot | null {
  const node = document.querySelector(`[data-tour="${target}"]`)
  if (!(node instanceof HTMLElement)) return null
  const rect = node.getBoundingClientRect()
  if (target === 'log') {
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      radius: `${rect.width / 2 + SPOT_PAD}px`,
    }
  }
  const card = node.closest('.depth-card')
  if (!(card instanceof HTMLElement) || card === node) {
    const radius = Number.parseFloat(getComputedStyle(node).borderTopLeftRadius) || 28
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, radius: `${radius + SPOT_PAD}px` }
  }
  const cardRect = card.getBoundingClientRect()
  const cardRadius = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius) || 28
  const atTop = rect.top - cardRect.top < 28
  const atBottom = cardRect.bottom - rect.bottom < 28
  const top = atTop ? cardRect.top : rect.top
  const bottom = atBottom ? cardRect.bottom : rect.bottom
  if (bottom - top < 120) {
    return {
      top: cardRect.top,
      left: cardRect.left,
      width: cardRect.width,
      height: cardRect.height,
      radius: `${cardRadius + SPOT_PAD}px`,
    }
  }
  return {
    top,
    left: cardRect.left,
    width: cardRect.width,
    height: bottom - top,
    radius: rounded(cardRadius, atTop, atBottom),
  }
}

export function IntroTour({
  onClose,
  onTarget,
}: {
  readonly onClose: () => void
  readonly onTarget?: (target: TourTarget | undefined) => void
}) {
  const { anchor, avatar, saveAnchor, saveAvatar } = useSettings()
  const { notify } = useNotice()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState('')
  const [spot, setSpot] = useState<Spot | null>(null)
  const stepRef = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const releases = useRef<Array<() => void>>([])
  const onCloseRef = useRef(onClose)
  const onTargetRef = useRef(onTarget)
  onCloseRef.current = onClose
  onTargetRef.current = onTarget
  const current = STEPS[step]
  const last = step === STEPS.length - 1
  const anchorReady = isNamedAnchor(draft)

  const finish = () => {
    markIntroSeen()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    onCloseRef.current()
  }

  const dismiss = () => {
    const gate = STEPS[stepRef.current]
    if (gate?.requireAnchor || gate?.requireAvatar) return
    finish()
  }

  const skip = () => {
    if (avatar) {
      finish()
      return
    }
    const index = STEPS.findIndex((item) => item.requireAvatar)
    const leaving = stepRef.current
    const release = pushEntry(() => {
      stepRef.current = leaving
      setStep(leaving)
    })
    releases.current.push(release)
    stepRef.current = index
    setStep(index)
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
      if (STEPS[stepRef.current]?.requireAnchor || STEPS[stepRef.current]?.requireAvatar) return
      markIntroSeen()
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const target = STEPS[step].target
    onTargetRef.current?.(target)
    if (!target) {
      setSpot(null)
      return
    }
    const dock = target === 'log'
    let frame = 0
    const measure = (allowScroll: boolean) => {
      const node = document.querySelector(`[data-tour="${target}"]`)
      if (!node) {
        setSpot(null)
        return
      }
      if (allowScroll && !dock) {
        const card = node.closest('.depth-card')
        const nodeTop = node.getBoundingClientRect().top
        const cardTop = card instanceof HTMLElement ? card.getBoundingClientRect().top : nodeTop
        const atTop = card instanceof HTMLElement && nodeTop - cardTop < 28
        const anchor = card instanceof HTMLElement && (atTop || node.getBoundingClientRect().height < 120) ? card : node
        const top = anchor.getBoundingClientRect().top
        if (Math.abs(top - 12) > 8) {
          const before = window.scrollY
          window.scrollBy({ top: top - 12, behavior: 'auto' })
          if (window.scrollY !== before) return
        }
      }
      setSpot(spotFor(target))
    }
    measure(true)
    const wait = window.setTimeout(() => measure(true), 48)
    const again = window.setTimeout(() => measure(true), 160)
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
      window.clearTimeout(again)
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [step])

  useEffect(() => {
    if (!STEPS[step]?.requireAnchor) return
    setDraft(isNamedAnchor(anchor) ? anchor : '')
  }, [anchor, step])

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
    const gap = 16
    const below = spot.top + spot.height + gap
    const above = spot.top - cardH - gap
    if (below + cardH <= window.innerHeight - 8) return below
    if (above >= 8) return above
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
        if (event.target === event.currentTarget) dismiss()
      }}
    >
      {spot ? (
        <div
          data-testid="intro-spot"
          aria-hidden="true"
          className="pointer-events-none absolute ring-2 ring-white/90"
          style={{
            top: spot.top - SPOT_PAD,
            left: spot.left - SPOT_PAD,
            width: spot.width + SPOT_PAD * 2,
            height: spot.height + SPOT_PAD * 2,
            borderRadius: spot.radius,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.5)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={dismiss} />
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
          {!current.requireAnchor && !current.requireAvatar && (
            <button
              type="button"
              data-testid="intro-skip"
              onClick={skip}
              className="press focus-ring text-[11px] font-extrabold uppercase tracking-wider text-muted"
            >
              Skip
            </button>
          )}
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
          <p className="w-full text-sm font-semibold leading-relaxed text-body">{current.body}</p>
          {current.requireAvatar && (
            <ProfilePhoto
              avatar={avatar}
              size="lg"
              testId="intro-avatar"
              onChange={(dataUrl) => saveAvatar(dataUrl, { quiet: true })}
              onError={() => notify('Choose an image')}
            />
          )}
          {current.requireAnchor && (
            <label className="flex w-full flex-col gap-1.5 text-left">
              <span className="eyebrow eyebrow-muted">Your goal</span>
              <input
                data-testid="intro-anchor"
                value={draft}
                placeholder="Name the goal"
                onChange={(event) => setDraft(event.target.value)}
                className="field w-full rounded-2xl px-3.5 py-3 text-base font-bold"
              />
            </label>
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
              className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold"
            >
              Back
            </Button>
          )}
          <Button
            tone="dark"
            data-testid="intro-next"
            disabled={(current.requireAnchor && !anchorReady) || (current.requireAvatar && !avatar)}
            onClick={() => {
              if (current.requireAvatar) {
                if (!avatar) return
                advance()
                return
              }
              if (current.requireAnchor) {
                const trimmed = draft.trim()
                if (!isNamedAnchor(trimmed)) return
                if (trimmed !== anchor.trim() && !saveAnchor(trimmed)) return
                finish()
                return
              }
              if (last) finish()
              else advance()
            }}
            className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold uppercase tracking-wider disabled:opacity-40"
          >
            {current.requireAnchor ? 'Set anchor' : current.requireAvatar ? 'Use photo' : last ? 'Get started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
