import { useState } from 'react'
import { useHabits } from '../../hooks/useHabits'
import { createId } from '../../lib/id'
import type { HabitDeck } from '../../types'
import { Button } from '../Common/Button'
import { TimePop } from '../Common/TimePop'

export function DeckSettings() {
  const habits = useHabits()
  const [decks, setDecks] = useState<HabitDeck[]>(() => habits.decks.map((deck) => ({ ...deck, habits: deck.habits.map((habit) => ({ ...habit })) })))
  const [deck1, setDeck1] = useState(habits.pacing.pendingConfig?.deck1Cutoff ?? habits.pacing.deck1Cutoff)
  const [deck2, setDeck2] = useState(habits.pacing.pendingConfig?.deck2Cutoff ?? habits.pacing.deck2Cutoff)
  const blocked = habits.habitDay.completedIds.length > 0 || habits.warnings.length > 0

  const updateTitle = (deckIndex: number, habitIndex: number, title: string) => {
    setDecks((current) => current.map((deck, index) => index === deckIndex
      ? { ...deck, habits: deck.habits.map((habit, item) => item === habitIndex ? { ...habit, title: title.slice(0, 60) } : habit) }
      : deck))
  }

  return (
    <div className="flex flex-col gap-3">
      {decks.map((deck, deckIndex) => (
        <div key={deck.id} className="flex flex-col gap-1.5">
          <input
            value={deck.name}
            onChange={(event) => setDecks((current) => current.map((item, index) => index === deckIndex ? { ...item, name: event.target.value } : item))}
            className="field w-full rounded-xl px-3 py-2 text-xs font-extrabold"
          />
          {deck.habits.map((habit, habitIndex) => (
            <input
              key={habit.id}
              value={habit.title}
              maxLength={60}
              onChange={(event) => updateTitle(deckIndex, habitIndex, event.target.value)}
              className="field w-full rounded-xl px-3 py-2 text-xs font-bold"
            />
          ))}
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
        </div>
      ))}
      <Button tone="dark" disabled={blocked} onClick={() => void habits.saveDecks(decks)} className="action-btn disabled:opacity-40">
        {blocked ? 'Decks locked today' : 'Save decks'}
      </Button>
      {habits.habitsNeedScore && <p className="text-[10px] font-bold text-faint">Scores are on-device until a Gemini key can rate them.</p>}
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
    </div>
  )
}
