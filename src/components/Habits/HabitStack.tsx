import { useState } from 'react'
import { useHabits } from '../../hooks/useHabits'
import { deckComplete, nextOpenHabit } from '../../services/engine'
import { Button } from '../Common/Button'
import { Eyebrow, Surface, Well } from '../Common/primitives'
import { DeckSettings } from './DeckSettings'

export function HabitStack() {
  const habits = useHabits()
  const [editing, setEditing] = useState(false)
  const [ptoConfirm, setPtoConfirm] = useState(false)
  const open = nextOpenHabit(habits.decks, habits.habitDay.completedIds)
  const locked = habits.cooldownMs > 0
  const hours = Math.ceil(habits.cooldownMs / 3600000)

  return (
    <Surface data-testid="habit-stack" data-tour="foundation" className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>Foundation</Eyebrow>
          <p className="text-sm font-extrabold text-ink">{habits.chainStreak} day foundation · {habits.ptoTokens} PTO</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            tone="card"
            aria-expanded={editing}
            onClick={() => setEditing((open) => !open)}
            className="rounded-xl px-3 py-2 text-[11px] font-extrabold"
          >
            {editing ? 'Done' : 'Edit'}
          </Button>
          {ptoConfirm ? (
            <>
              <Button tone="card" onClick={() => setPtoConfirm(false)} className="rounded-xl px-3 py-2 text-[11px] font-extrabold">
                Cancel
              </Button>
              <Button
                tone="dark"
                onClick={() => {
                  setPtoConfirm(false)
                  habits.usePto()
                }}
                className="rounded-xl px-3 py-2 text-[11px] font-extrabold"
              >
                Confirm
              </Button>
            </>
          ) : (
            <Button tone="card" onClick={() => setPtoConfirm(true)} className="rounded-xl px-3 py-2 text-[11px] font-extrabold">
              Use PTO
            </Button>
          )}
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
          <Well key={deck.id} className="flex flex-col gap-1.5 px-3 py-2.5">
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
                  className={`press focus-ring flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-bold ${
                    complete ? 'text-muted line-through' : ready ? 'bg-ink text-canvas' : 'text-faint'
                  }`}
                >
                  <span>{habit.title}</span>
                  <span className="font-num">{habit.points}</span>
                </button>
              )
            })}
          </Well>
        )
      })}
      {locked && <p className="text-[10px] font-bold text-faint">Cutoff edits unlock in {hours}h.</p>}
    </Surface>
  )
}
