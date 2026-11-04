import { useEffect, useState } from 'react'
import { useLedger } from '../../hooks/useLedger'
import { useNotice } from '../../hooks/useNotice'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { isNamedAnchor } from '../../lib/dates'
import { buildCategoricalPayload, callGemini } from '../../lib/gemini'
import {
  elapsedToDuration,
  formatElapsed,
  pauseSessionTimer,
  readSessionTimer,
  resetSessionTimer,
  startSessionTimer,
  subscribeSessionTimer,
} from '../../lib/sessionTimer'
import { DEMO_ACTION } from '../../services/demo'
import { coerceJudgment, offlineJudgment, scoreJudgment } from '../../services/engine'
import type { ActionJudgmentResult } from '../../types'
import type { ActionScore } from '../../types'
import { Button } from '../Common/Button'
import { CloseButton, ModalSheet } from '../Common/ModalSheet'
import { weightClassStyles } from '../Feed/weightStyles'
import { ClockIcon, MinusIcon, PlusIcon, SparkleIcon } from '../Icons'

const CHIPS = [15, 30, 45, 60, 90]

type DurationMode = 'manual' | 'timer'

export function ActionModal({
  onClose,
  onEditAnchor,
}: {
  readonly onClose: () => void
  readonly onEditAnchor: () => void
}) {
  const { appendEarn } = useLedger()
  const { notify } = useNotice()
  const { feedback } = useSensory()
  const { anchor, apiKey, demoMode } = useSettings()
  const named = isNamedAnchor(anchor)
  const [text, setText] = useState(demoMode ? DEMO_ACTION.text : '')
  const [mode, setMode] = useState<DurationMode>(() => (readSessionTimer().elapsedMs > 0 || readSessionTimer().running ? 'timer' : 'manual'))
  const [duration, setDuration] = useState(demoMode ? DEMO_ACTION.duration : 60)
  const [pending, setPending] = useState(false)
  const [verdict, setVerdict] = useState<ActionScore | null>(null)
  const [tick, setTick] = useState(0)

  const timer = readSessionTimer()
  const timedDuration = elapsedToDuration(timer.elapsedMs)
  const sessionMinutes = mode === 'timer' ? timedDuration : duration

  useEffect(() => subscribeSessionTimer(() => setTick((value) => value + 1)), [])

  useEffect(() => {
    if (!timer.running) return
    const id = window.setInterval(() => setTick((value) => value + 1), 250)
    return () => window.clearInterval(id)
  }, [timer.running])

  const setMinutes = (next: number) => {
    feedback('click')
    setDuration(Math.max(5, Math.min(360, next)))
  }

  const chooseMode = (next: DurationMode) => {
    feedback('click')
    if (next === 'manual' && timer.elapsedMs > 0) setDuration(timedDuration)
    setMode(next)
  }

  const submit = async () => {
    if (!isNamedAnchor(anchor)) {
      feedback('error')
      notify('Name your discipline anchor first')
      return
    }

    const rawAction = text.trim()
    if (!rawAction) {
      feedback('error')
      notify('Describe what you accomplished')
      return
    }

    if (mode === 'timer' && timer.elapsedMs < 5_000) {
      feedback('error')
      notify('Run the timer a bit longer, or switch to Manual')
      return
    }

    if (mode === 'timer' && timer.running) pauseSessionTimer()

    setPending(true)
    let score: ActionScore
    if (!apiKey.trim()) {
      score = scoreJudgment(offlineJudgment(), rawAction, sessionMinutes)
      notify('Scored on device without an anchor check')
    } else {
      try {
        const payload = buildCategoricalPayload(anchor, rawAction, sessionMinutes)
        const { data, model } = await callGemini<ActionJudgmentResult>(payload, apiKey)
        score = scoreJudgment(coerceJudgment(data), rawAction, sessionMinutes)
        notify(`AI Judged via ${model}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Offline fallback used'
        score = scoreJudgment(offlineJudgment(message), rawAction, sessionMinutes)
        notify(`Notice: ${message}`)
      }
    }

    appendEarn({
      title: score.title,
      points: score.points,
      effort_strain: score.strain,
      anchor_alignment: score.alignment,
      multiplier: score.multiplier,
      weight_class: score.weightClass,
      formula_breakdown: score.breakdown,
      reasoning: score.reasoning,
    })
    if (mode === 'timer') resetSessionTimer()
    setVerdict(score)
    setPending(false)
  }

  const weight = verdict ? weightClassStyles(verdict.multiplier) : null

  return (
    <ModalSheet labelledBy="action-heading" onDismiss={onClose}>
      <div className="flex justify-between items-center">
        <div>
          <span className="eyebrow block mb-0.5">
            Discipline Assessment
          </span>
          <h3 id="action-heading" className="text-base heading-athletic text-ink">
            Log & Judge Action
          </h3>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="input-action-text" className="eyebrow eyebrow-muted">
          What did you accomplish?
        </label>
        <textarea
          id="input-action-text"
          data-testid="action-text"
          rows={3}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="e.g., Push day at the gym with Brandon"
          className="field w-full rounded-2xl p-3.5 text-xs font-bold resize-none"
        />
        <div className="flex items-center gap-1 text-[10px] text-faint font-semibold px-1">
          <SparkleIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Direct work toward the anchor earns more. Other productive logs still earn half.</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="eyebrow eyebrow-muted">Session duration</span>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            tone={mode === 'manual' ? 'pillActive' : 'pill'}
            data-testid="duration-manual"
            onClick={() => chooseMode('manual')}
            className="w-full py-2 rounded-xl text-[10px] font-extrabold"
          >
            Manual
          </Button>
          <Button
            tone={mode === 'timer' ? 'pillActive' : 'pill'}
            data-testid="duration-timer"
            onClick={() => chooseMode('timer')}
            className="w-full py-2 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5"
          >
            <ClockIcon className="w-3.5 h-3.5" />
            Timer
          </Button>
        </div>

        {mode === 'manual' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted">Minutes</span>
              <div className="flex items-center gap-1.5">
                <button type="button" className="w-7 h-7 rounded-lg depth-well text-body flex items-center justify-center active:scale-90" aria-label="Decrease Duration" onClick={() => setMinutes(duration - 5)}>
                  <MinusIcon />
                </button>
                <span data-testid="action-duration" className="font-num text-xs font-extrabold text-ink min-w-[42px] text-center">
                  {duration}m
                </span>
                <button type="button" className="w-7 h-7 rounded-lg depth-well text-body flex items-center justify-center active:scale-90" aria-label="Increase Duration" onClick={() => setMinutes(duration + 5)}>
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {CHIPS.map((chip) => (
                <Button
                  key={chip}
                  tone={duration === chip ? 'pillActive' : 'pill'}
                  onClick={() => setMinutes(chip)}
                  className="w-full py-2 rounded-xl text-[10px] font-extrabold font-num"
                >
                  {chip}m
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="depth-well rounded-2xl px-4 py-3 flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="eyebrow block">Elapsed</span>
                <span data-testid="timer-elapsed" className="mt-0.5 block font-num text-3xl font-extrabold tracking-tight text-ink">
                  {formatElapsed(timer.elapsedMs)}
                </span>
              </div>
              <span data-testid="action-duration" className="font-num text-xs font-extrabold text-muted">
                {timedDuration}m scored
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                tone="card"
                data-testid="timer-reset"
                onClick={() => {
                  feedback('click')
                  resetSessionTimer()
                }}
                className="py-2.5 rounded-xl text-[11px] font-extrabold active:scale-95"
              >
                Reset
              </Button>
              <Button
                tone={timer.running ? 'card' : 'dark'}
                data-testid="timer-toggle"
                onClick={() => {
                  feedback('click')
                  if (timer.running) pauseSessionTimer()
                  else startSessionTimer()
                }}
                className="col-span-2 py-2.5 rounded-xl text-[11px] font-extrabold active:scale-95"
              >
                {timer.running ? 'Pause' : timer.elapsedMs > 0 ? 'Resume' : 'Start'}
              </Button>
            </div>
            <p className="text-[10px] leading-relaxed text-muted">
              The timer keeps running if you close this sheet. Scoring still floors at 5 minutes.
            </p>
          </div>
        )}
      </div>

      {!named && (
        <div className="depth-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-[11px] leading-relaxed text-body">Name your discipline anchor before this can be judged.</p>
          <Button
            tone="dark"
            onClick={() => {
              feedback('click')
              onEditAnchor()
            }}
            className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-extrabold active:scale-95"
          >
            Set anchor
          </Button>
        </div>
      )}

      {verdict && weight && (
        <div data-testid="verdict-card" className="brand-mark rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Verdict</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${weight.badge}`}>{verdict.weightClass}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Polished Title</span>
            <h4 className="text-sm font-black text-white">{verdict.title}</h4>
          </div>
          <div className="flex items-baseline gap-1">
            <span data-testid="verdict-points" className="text-3xl font-black text-emerald-400 font-num">+{verdict.points}</span>
            <span className="text-xs font-bold text-zinc-400 font-num">PTS</span>
          </div>
          {verdict.partial && (
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Half credit · still counts today</span>
          )}
          <div className="text-[10px] font-num text-zinc-400 border-t border-zinc-800 pt-2">{verdict.breakdown}</div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">{verdict.reasoning}</p>
        </div>
      )}

      <Button
        tone="dark"
        data-testid="submit-action"
        disabled={pending}
        onClick={() => {
          if (!named) {
            feedback('click')
            onEditAnchor()
            return
          }
          void submit()
        }}
        className="action-btn flex items-center justify-center gap-2 disabled:opacity-70"
      >
        <SparkleIcon className="w-4 h-4" />
        <span>{pending ? 'Evaluating Action...' : named ? 'Submit for Judgment' : 'Set anchor'}</span>
      </Button>
    </ModalSheet>
  )
}
