import { useState } from 'react'
import { useHabits } from '../../hooks/useHabits'
import { deckComplete, nextOpenHabit } from '../../services/engine'
import { Button } from '../Common/Button'
import { DeckSettings } from './DeckSettings'

export function HabitStack() {
  const habits = useHabits()
  const [editing, setEditing] = useState(false)
  const open = nextOpenHabit(habits.decks, habits.habitDay.completedIds)
  const locked = habits.cooldownMs > 0
  const hours = Math.ceil(habits.cooldownMs / 3600000)

  return (
    <section className="depth-card rounded-[28px] p-4 flex flex-col gap-3" data-testid="habit-stack">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint">The Chain</span>
          <p className="text-sm font-extrabold text-ink">{habits.chainStreak} day chain · {habits.ptoTokens} PTO</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            tone="card"
            aria-expanded={editing}
            onClick={() => setEditing((open) => !open)}
            className="rounded-xl px-3 py-2 text-[11px] font-extrabold"
          >
            {editing ? 'Done' : 'Edit'}
          </Button>
          <Button tone="card" onClick={habits.usePto} className="rounded-xl px-3 py-2 text-[11px] font-extrabold">
            Use PTO
          </Button>
        </div>
      </div>
      {habits.warnings.length > 0 && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
          {habits.warnings.length} warning{habits.warnings.length === 1 ? '' : 's'} open. A heavyweight anchor log clears one.
        </p>
      )}
      {habits.habitDay.shielded && (
        <p className="text-[11px] font-bold text-muted">Today is shielded.</p>
      )}
      {editing ? <DeckSettings /> : habits.decks.map((deck, index) => {
        const done = deckComplete(deck, habits.habitDay.completedIds)
        const deckLocked = index > 0 && !deckComplete(habits.decks[index - 1], habits.habitDay.completedIds)
        return (
          <div key={deck.id} className="rounded-2xl border border-line bg-card px-3 py-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">{deck.name}</span>
              <span className="font-num text-[10px] font-extrabold text-faint">{done ? 'Clear' : deckLocked ? 'Locked' : 'Open'}</span>
            </div>
            {deck.habits.map((habit) => {
              const complete = habits.habitDay.completedIds.includes(habit.id)
              const ready = open?.habit.id === habit.id
              return (
                <button
                  key={habit.id}
                  type="button"
                  disabled={!ready}
                  onClick={() => habits.completeHabit(habit.id)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-bold ${
                    complete ? 'text-muted line-through' : ready ? 'bg-ink text-canvas' : 'text-faint'
                  }`}
                >
                  <span>{habit.title}</span>
                  <span className="font-num">{habit.points}</span>
                </button>
              )
            })}
          </div>
        )
      })}
      {locked && <p className="text-[10px] font-bold text-faint">Cutoff edits unlock in {hours}h.</p>}
    </section>
  )
}
