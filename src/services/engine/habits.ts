import { localDateKey, shiftDateKey } from '../../lib/dates'
import type { HabitDay, HabitDeck, MicroHabit, Relevance, StrainBand } from '../../types'

const STRAIN_POINTS = { HIGH: 60, MEDIUM: 40, LOW: 20 } as const
const RELEVANCE_MULT = { DIRECT: 1, ENABLING: 0.75, GENERAL: 0.5 } as const
const WEIGHT_MULT = { HEAVYWEIGHT: 2, CRUISERWEIGHT: 1.5, LIGHTWEIGHT: 1 } as const

export const HABIT_MINUTES_MIN = 5
export const HABIT_MINUTES_MAX = 360
export const HABIT_MINUTES_STEP = 5
export const HABIT_MINUTES_DEFAULT = 15

function habit(id: string, title: string, strain: StrainBand = 'MEDIUM', relevance: Relevance = 'GENERAL'): MicroHabit {
  return { id, title, points: 0, strain, relevance, minutes: HABIT_MINUTES_DEFAULT }
}

export function defaultDecks(): HabitDeck[] {
  return distributeHabitPoints([
    {
      id: 'deck-1',
      name: 'Morning',
      habits: [
        habit('h-1-1', 'Make the bed'),
        habit('h-1-2', 'Drink a glass of water'),
        habit('h-1-3', 'Name the first anchor block'),
      ],
    },
    {
      id: 'deck-2',
      name: 'Midday',
      habits: [
        habit('h-2-1', 'One focused work block'),
        habit('h-2-2', 'Clear the workspace'),
        habit('h-2-3', 'Take a short walk'),
      ],
    },
    {
      id: 'deck-3',
      name: 'Evening',
      habits: [
        habit('h-3-1', 'Log what moved the anchor'),
        habit('h-3-2', 'Set up tomorrow'),
        habit('h-3-3', 'Lights out on time'),
      ],
    },
  ])
}

export function emptyHabitDay(date = localDateKey()): HabitDay {
  return { date, completedIds: [], clearedWarnings: [], shielded: false }
}

export function clampHabitMinutes(value: unknown): number {
  const rounded = Math.round(Number(value) / HABIT_MINUTES_STEP) * HABIT_MINUTES_STEP
  if (!Number.isFinite(rounded)) return HABIT_MINUTES_DEFAULT
  return Math.min(HABIT_MINUTES_MAX, Math.max(HABIT_MINUTES_MIN, rounded))
}

export function habitWeight(habit: Pick<MicroHabit, 'strain' | 'relevance' | 'weightClass' | 'minutes'>): number {
  const strain = STRAIN_POINTS[habit.strain] ?? STRAIN_POINTS.MEDIUM
  const relevance = RELEVANCE_MULT[habit.relevance] ?? RELEVANCE_MULT.GENERAL
  const weight = WEIGHT_MULT[habit.weightClass ?? 'LIGHTWEIGHT'] ?? WEIGHT_MULT.LIGHTWEIGHT
  return strain * relevance * weight * clampHabitMinutes(habit.minutes)
}

export function distributeHabitPoints(decks: readonly HabitDeck[]): HabitDeck[] {
  const habits = decks.flatMap((deck) => deck.habits)
  const weights = habits.map((item) => habitWeight(item))
  const raw = weights.reduce((sum, weight) => sum + weight, 0) || 1
  const target = Math.min(85, Math.max(60, Math.round(raw)))
  const scale = target / raw
  const points = weights.map((weight) => Math.max(1, Math.round(weight * scale)))
  let drift = target - points.reduce((sum, value) => sum + value, 0)
  const order = points.map((_, index) => index).sort((a, b) => points[b] - points[a])
  let guard = 0
  while (drift !== 0 && guard < habits.length) {
    let moved = false
    for (const index of order) {
      if (drift === 0) break
      if (drift > 0) {
        points[index] += 1
        drift -= 1
        moved = true
      } else if (points[index] > 1) {
        points[index] -= 1
        drift += 1
        moved = true
      }
    }
    if (!moved) break
    guard += 1
  }
  let offset = 0
  return decks.map((deck) => ({
    ...deck,
    habits: deck.habits.map((item) => {
      const next = { ...item, minutes: clampHabitMinutes(item.minutes), points: points[offset] ?? 1 }
      offset += 1
      return next
    }),
  }))
}

export function deckComplete(deck: HabitDeck, completedIds: readonly string[]): boolean {
  return deck.habits.length > 0 && deck.habits.every((item) => completedIds.includes(item.id))
}

export function nextOpenHabit(decks: readonly HabitDeck[], completedIds: readonly string[]) {
  for (let index = 0; index < decks.length; index += 1) {
    const deck = decks[index]
    if (deckComplete(deck, completedIds)) continue
    if (index > 0 && !deckComplete(decks[index - 1], completedIds)) return null
    const habitItem = deck.habits.find((item) => !completedIds.includes(item.id))
    return habitItem ? { deckIndex: index, habit: habitItem } : null
  }
  return null
}

export function unfinishedHabits(decks: readonly HabitDeck[], completedIds: readonly string[]): number {
  return decks.reduce(
    (count, deck) => count + deck.habits.filter((item) => !completedIds.includes(item.id)).length,
    0,
  )
}

export function allDecksComplete(decks: readonly HabitDeck[], completedIds: readonly string[]): boolean {
  return decks.length === 3 && decks.every((deck) => deckComplete(deck, completedIds))
}

export function clampHabitTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').slice(0, 60)
}

export function decksAreValid(decks: readonly HabitDeck[]): string | null {
  if (decks.length !== 3) return 'Keep exactly 3 habit decks.'
  for (const deck of decks) {
    if (!deck.name.trim()) return 'Name each deck.'
    if (deck.habits.length < 3 || deck.habits.length > 5) return 'Each deck needs 3 to 5 habits.'
    if (deck.habits.some((item) => !clampHabitTitle(item.title))) return 'Each habit needs a title.'
  }
  return null
}

export function tomorrowKey(today = localDateKey()): string {
  return shiftDateKey(today, 1)
}
