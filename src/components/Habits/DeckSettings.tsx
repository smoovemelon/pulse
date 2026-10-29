import { useState } from 'react'
import { useHabits } from '../../hooks/useHabits'
import { createId } from '../../lib/id'
import { deckComplete } from '../../services/engine'
import type { HabitDeck } from '../../types'
import { Button } from '../Common/Button'
import { Well } from '../Common/primitives'
import { TimePop } from '../Common/TimePop'
import { DECK_FACE } from './deckFace'

export function DeckSettings() {
  const habits = useHabits()
  const [decks, setDecks] = useState<HabitDeck[]>(() => habits.decks.map((deck) => ({ ...deck, habits: deck.habits.map((habit) => ({ ...habit })) })))
  const [deck1, setDeck1] = useState(habits.pacing.pendingConfig?.deck1Cutoff ?? habits.pacing.deck1Cutoff)
  const [deck2, setDeck2] = useState(habits.pacing.pendingConfig?.deck2Cutoff ?? habits.pacing.deck2Cutoff)
  const [judging, setJudging] = useState(false)
  const blocked = habits.habitDay.completedIds.length > 0 || habits.warnings.length > 0

  const judge = async () => {
    setJudging(true)
    const scored = await habits.saveDecks(decks)
    setJudging(false)
    if (!scored) return
    setDecks(scored.map((deck) => ({ ...deck, habits: deck.habits.map((habit) => ({ ...habit })) })))
  }

  const updateTitle = (deckIndex: number, habitIndex: number, title: string) => {
    setDecks((current) => current.map((deck, index) => index === deckIndex
      ? { ...deck, habits: deck.habits.map((habit, item) => item === habitIndex ? { ...habit, title: title.slice(0, 60) } : habit) }
      : deck))
  }

  return (
    <div className="flex flex-col gap-3">
      {decks.map((deck, deckIndex) => {
        const face = DECK_FACE[deckIndex] ?? DECK_FACE[0]
        const done = deckComplete(deck, habits.habitDay.completedIds)
        const locked = deckIndex > 0 && !deckComplete(decks[deckIndex - 1], habits.habitDay.completedIds)
        const status = done ? 'Clear' : locked ? 'Locked' : 'Open'
        const statusClass = done ? 'deck-status-clear' : locked ? 'deck-status' : 'deck-status-open'
        return (
          <Well key={deck.id} className="flex flex-col gap-2 px-3 py-3">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${face.chip}`}>
                <face.Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold tracking-tight text-ink">{deck.name}</p>
                <div className="mt-1.5 flex gap-1" aria-hidden="true">
                  {deck.habits.map((habit) => (
                    <span
                      key={habit.id}
                      className={`meter-track h-1 flex-1 rounded-full ${habits.habitDay.completedIds.includes(habit.id) ? 'meter-fill bg-emerald-500' : 'bg-line'}`}
                    />
                  ))}
                </div>
              </div>
              <span className={`shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-extrabold ${statusClass}`}>
                {status}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {deck.habits.map((habit, habitIndex) => (
                <div key={habit.id} className="habit-groove flex items-center justify-between gap-2 rounded-2xl border border-line px-2.5 py-2">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-num text-[10px] text-faint">
                      {habitIndex + 1}
                    </span>
                    <input
                      value={habit.title}
                      maxLength={60}
                      aria-label={`${deck.name} habit ${habitIndex + 1}`}
                      onChange={(event) => updateTitle(deckIndex, habitIndex, event.target.value)}
                      className="focus-ring min-w-0 flex-1 bg-transparent text-xs font-bold text-ink outline-none"
                    />
                  </span>
                  <span className="shrink-0 rounded-full border border-line bg-well px-2 py-0.5 font-num text-[10px] text-muted">
                    {habit.points > 0 ? habit.points : '—'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                tone="card"
                disabled={deck.habits.length >= 5}
                onClick={() => setDecks((current) => current.map((item, index) => index === deckIndex ? { ...item, habits: [...item.habits, { id: createId('h'), title: 'New habit', points: 0, strain: 'MEDIUM', relevance: 'GENERAL' }] } : item))}
                className="rounded-xl px-3 py-2 text-[10px] font-extrabold disabled:opacity-40"
              >
                Add
              </Button>
              <Button
                tone="card"
                disabled={deck.habits.length <= 3}
                onClick={() => setDecks((current) => current.map((item, index) => index === deckIndex ? { ...item, habits: item.habits.slice(0, -1) } : item))}
                className="rounded-xl px-3 py-2 text-[10px] font-extrabold disabled:opacity-40"
              >
                Remove
              </Button>
            </div>
          </Well>
        )
      })}
      <Button tone="dark" disabled={blocked || judging} onClick={() => void judge()} className="action-btn disabled:opacity-40">
        {judging ? 'Judging habits' : blocked ? 'Decks locked today' : 'Judge habits'}
      </Button>
      <p className="text-[10px] font-bold leading-relaxed text-faint">
        Judge habits scores every card and writes a point value on each habit.
        {habits.habitsNeedScore ? ' Scores stay on-device until a Gemini key can rate them.' : ''}
      </p>
      <Well className="flex flex-col gap-2 px-3 py-3">
        <span className="eyebrow eyebrow-muted">Pacing cutoffs</span>
        <div className="grid grid-cols-2 gap-2">
          <TimePop label={habits.decks[0]?.name ?? 'Deck 1'} value={deck1} onChange={setDeck1} />
          <TimePop label={habits.decks[1]?.name ?? 'Deck 2'} value={deck2} onChange={setDeck2} />
        </div>
        <Button tone="card" onClick={() => habits.savePacing(deck1, deck2)} className="rounded-xl py-2.5 text-[11px] font-extrabold">
          Queue cutoffs for tomorrow
        </Button>
        {habits.pacing.pendingConfig && (
          <p className="text-[10px] font-bold text-faint">
            Tomorrow: {habits.pacing.pendingConfig.deck1Cutoff} and {habits.pacing.pendingConfig.deck2Cutoff}.
          </p>
        )}
      </Well>
    </div>
  )
}
