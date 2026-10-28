import { useState } from 'react'
import { useHabits } from '../../hooks/useHabits'
import { deckComplete, nextOpenHabit } from '../../services/engine'
import type { HabitDeck } from '../../types'
import { Button } from '../Common/Button'
import { Eyebrow, Surface, Well } from '../Common/primitives'
import { EveningIcon, MiddayIcon, MorningIcon } from '../Icons'
import { DeckSettings } from './DeckSettings'

const DECK_FACE = [
  { chip: 'chip-amber', Icon: MorningIcon },
  { chip: 'chip-sky', Icon: MiddayIcon },
  { chip: 'chip-violet', Icon: EveningIcon },
] as const

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
      {editing ? <DeckSettings /> : habits.decks.map((deck, index) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          index={index}
          completedIds={habits.habitDay.completedIds}
          locked={index > 0 && !deckComplete(habits.decks[index - 1], habits.habitDay.completedIds)}
          readyId={open?.habit.id}
          onComplete={habits.completeHabit}
        />
      ))}
      {locked && <p className="text-[10px] font-bold text-faint">Cutoff edits unlock in {hours}h.</p>}
    </Surface>
  )
}

function DeckCard({
  deck,
  index,
  completedIds,
  locked,
  readyId,
  onComplete,
}: {
  readonly deck: HabitDeck
  readonly index: number
  readonly completedIds: readonly string[]
  readonly locked: boolean
  readonly readyId: string | undefined
  readonly onComplete: (habitId: string) => void
}) {
  const face = DECK_FACE[index] ?? DECK_FACE[0]
  const done = deckComplete(deck, completedIds)
  const status = done ? 'Clear' : locked ? 'Locked' : 'Open'
  const statusClass = done
    ? 'chip-emerald'
    : locked
      ? 'border-line bg-card text-faint'
      : 'border-ink bg-ink text-canvas'

  return (
    <Well className="flex flex-col gap-2 px-3 py-3">
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
                className={`h-1 flex-1 rounded-full ${completedIds.includes(habit.id) ? 'bg-ink' : 'bg-line'}`}
              />
            ))}
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 font-num text-[9px] font-extrabold uppercase tracking-wide ${statusClass}`}>
          {status}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {deck.habits.map((habit, habitIndex) => {
          const complete = completedIds.includes(habit.id)
          const ready = readyId === habit.id
          return (
            <button
              key={habit.id}
              type="button"
              disabled={!ready}
              onClick={() => onComplete(habit.id)}
              className={`press focus-ring flex items-center justify-between gap-2 rounded-2xl border px-2.5 py-2 text-left text-xs font-bold ${
                ready
                  ? 'border-ink bg-ink text-canvas shadow-[0_8px_16px_-8px_rgba(0,0,0,0.45)]'
                  : complete
                    ? 'border-line bg-card text-muted'
                    : 'border-line bg-card text-faint'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-num text-[10px] ${
                  ready ? 'bg-canvas text-ink' : complete ? 'bg-ink text-canvas' : 'border border-line text-faint'
                }`}>
                  {complete ? '✓' : habitIndex + 1}
                </span>
                <span className={`truncate ${complete ? 'line-through' : ''}`}>{habit.title}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-num text-[10px] ${
                ready ? 'bg-canvas text-ink' : 'border border-line bg-well text-muted'
              }`}>
                {habit.points}
              </span>
            </button>
          )
        })}
      </div>
    </Well>
  )
}
