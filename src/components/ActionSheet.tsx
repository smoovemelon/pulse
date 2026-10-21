import { useState } from 'react'
import { ClockIcon, MinusIcon, PlusIcon, SparkleIcon } from './Icons'
import { CloseButton, Modal, Sheet } from './Modal'
import { calculateActionPoints, localActionFallback, weightClassStyles } from '../lib/economy'
import { buildJudgmentPayload, callGemini, polishReasoning, type ActionJudgment } from '../lib/gemini'
import { usePulse } from '../pulse/context'
import type { ActionScore } from '../types'

const CHIPS = [15, 30, 45, 60, 90]

export function ActionSheet({ onClose }: { onClose: () => void }) {
  const { state, notify, feedback, commitEarn } = usePulse()
  const [text, setText] = useState('')
  const [duration, setDuration] = useState(60)
  const [pending, setPending] = useState(false)
  const [verdict, setVerdict] = useState<ActionScore | null>(null)

  const setMinutes = (next: number) => {
    feedback('click')
    setDuration(Math.max(5, Math.min(360, next)))
  }

  const submit = async () => {
    const rawAction = text.trim()
    if (!rawAction) {
      feedback('error')
      notify('Describe what you accomplished')
      return
    }

    setPending(true)
    let score: ActionScore
    try {
      const history = state.transactions
        .filter((tx) => tx.type === 'EARN')
        .slice(0, 4)
        .map((tx) => `- ${tx.title} (${tx.effort_strain} strain, ${tx.timestamp})`)
        .join('\n')
      const payload = buildJudgmentPayload(state.disciplineAnchor, rawAction, duration, history)
      const { data, model } = await callGemini<ActionJudgment>(payload, state.apiKey)
      if (!data?.reasoning) throw new Error('Empty response from model')
      score = calculateActionPoints(
        data.effort_strain,
        data.anchor_alignment,
        duration,
        data.polished_title,
        rawAction,
        polishReasoning(data.reasoning),
      )
      notify(`AI Judged via ${model}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Offline fallback used'
      score = localActionFallback(rawAction, duration, message)
      notify(`Notice: ${message}`)
    }

    commitEarn({
      title: score.title,
      points: score.points,
      effort_strain: score.strain,
      anchor_alignment: score.alignment,
      multiplier: score.multiplier,
      weight_class: score.weightClass,
      formula_breakdown: score.breakdown,
      reasoning: score.reasoning,
    })
    setVerdict(score)
    setPending(false)
  }

  const weight = verdict ? weightClassStyles(verdict.multiplier) : null

  return (
    <Modal labelledBy="action-heading">
      <Sheet>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block mb-0.5">Discipline Assessment</span>
            <h3 id="action-heading" className="text-base heading-athletic text-ink">Log & Judge Action</h3>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="input-action-text" className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
            What did you accomplish?
          </label>
          <textarea
            id="input-action-text"
            data-testid="action-text"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g., Push day at the gym with Brandon"
            className="field w-full rounded-2xl p-3.5 text-xs focus:outline-none resize-none"
          />
          <div className="flex items-center gap-1 text-[10px] text-faint font-semibold px-1">
            <SparkleIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Context-aware AI rates strain against your recent history</span>
          </div>
        </div>

        <div className="depth-well rounded-2xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-muted" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-body">Session Duration</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card px-2 py-1 rounded-xl border border-line shadow-sm">
              <button type="button" className="w-6 h-6 rounded-lg bg-well text-body flex items-center justify-center active:scale-90" aria-label="Decrease Duration" onClick={() => setMinutes(duration - 5)}>
                <MinusIcon />
              </button>
              <span data-testid="action-duration" className="font-num text-xs font-extrabold text-ink px-1.5 min-w-[50px] text-center">
                {duration}m
              </span>
              <button type="button" className="w-6 h-6 rounded-lg bg-well text-body flex items-center justify-center active:scale-90" aria-label="Increase Duration" onClick={() => setMinutes(duration + 5)}>
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setMinutes(chip)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-extrabold font-num ${
                  duration === chip ? 'depth-button-dark' : 'depth-card text-body'
                }`}
              >
                {chip}m
              </button>
            ))}
          </div>
        </div>

        {verdict && weight && (
          <div data-testid="verdict-card" className="bg-[#18181B] text-white rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
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
            <div className="text-[10px] font-num text-zinc-400 border-t border-zinc-800 pt-2">{verdict.breakdown}</div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">{verdict.reasoning}</p>
          </div>
        )}

        <button
          type="button"
          data-testid="submit-action"
          disabled={pending}
          onClick={() => void submit()}
          className="w-full py-3.5 rounded-2xl depth-button-dark font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <SparkleIcon className="w-4 h-4" />
          <span>{pending ? 'Evaluating Action...' : 'Submit for Judgment'}</span>
        </button>
      </Sheet>
    </Modal>
  )
}
