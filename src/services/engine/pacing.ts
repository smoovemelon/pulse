import { localDateKey, shiftDateKey } from '../../lib/dates'
import type { HabitDay, HabitDeck, PacingScheduleConfig, PulseState, WarningId } from '../../types'
import { forgeTarget } from './forge'
import { economyPreset } from './vaultValuation'
import { allDecksComplete, deckComplete, defaultDecks, emptyHabitDay, unfinishedHabits } from './habits'
import { earnedOn } from './momentum'

const COOLDOWN_MS = 48 * 60 * 60 * 1000
const WARNING_ORDER: readonly WarningId[] = ['deck1', 'deck2', 'deck3']

export function disciplineDefaults(now = new Date()) {
  return {
    decks: defaultDecks(),
    habitDay: emptyHabitDay(localDateKey(now)),
    joinedAt: now.toISOString(),
    pacing: defaultPacing(now),
    warnings: [] as PulseState['warnings'],
    ptoTokens: 1,
    ptoCadence: 0,
    chainStreak: 0,
    forgeStreak: 0,
    lastChainCompletedDate: '',
    lastForgeCompletedDate: '',
    economy: economyPreset('balanced'),
    difficultyLocked: false,
    discountFrozenUntil: '',
    habitsNeedScore: true,
  }
}

export function defaultPacing(now = new Date()): PacingScheduleConfig {
  return {
    deck1Cutoff: '13:00',
    deck2Cutoff: '19:00',
    auditCutoff: '00:00',
    lastModified: new Date(now.getTime() - COOLDOWN_MS).toISOString(),
  }
}

export function clockMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function minutesNow(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}

export function minutesUntilCutoff(cutoff: string, now = new Date()): number {
  const target = clockMinutes(cutoff) ?? 0
  const current = minutesNow(now)
  if (target === 0) return 24 * 60 - current
  if (current <= target) return target - current
  return 24 * 60 - current + target
}

export function pastCutoff(cutoff: string, now = new Date()): boolean {
  const target = clockMinutes(cutoff) ?? 0
  if (target === 0) return false
  return minutesNow(now) >= target
}

export function perkTier(chainStreak: number, forgeStreak: number) {
  const days = Math.min(chainStreak, forgeStreak)
  if (days >= 30) return { tier: 3, capacity: 4, discount: 0.2, auditCutoff: '02:00' }
  if (days >= 14) return { tier: 2, capacity: 3, discount: 0.15, auditCutoff: '02:00' }
  if (days >= 7) return { tier: 1, capacity: 2, discount: 0.1, auditCutoff: '02:00' }
  return { tier: 0, capacity: 2, discount: 0, auditCutoff: '00:00' }
}

export function decayPenalty(chainStreak: number, forgeStreak: number): number {
  return perkTier(chainStreak, forgeStreak).tier >= 2 ? 20 : 15
}

export function discountRate(state: Pick<PulseState, 'chainStreak' | 'forgeStreak' | 'discountFrozenUntil'>, now = new Date()): number {
  if (state.discountFrozenUntil && Date.parse(state.discountFrozenUntil) > now.getTime()) return 0
  return perkTier(state.chainStreak, state.forgeStreak).discount
}

export function chargeCost(state: Pick<PulseState, 'chainStreak' | 'forgeStreak' | 'discountFrozenUntil'>, cost: number, now = new Date()): number {
  return Math.max(1, Math.round(cost * (1 - discountRate(state, now))))
}

export function cooldownRemaining(pacing: PacingScheduleConfig, now = new Date()): number {
  const elapsed = now.getTime() - Date.parse(pacing.lastModified)
  return Math.max(0, COOLDOWN_MS - elapsed)
}

export function applyPendingPacing(pacing: PacingScheduleConfig, today = localDateKey()): PacingScheduleConfig {
  if (!pacing.pendingConfig || pacing.pendingConfig.effectiveDate > today) return pacing
  return {
    ...pacing,
    deck1Cutoff: pacing.pendingConfig.deck1Cutoff,
    deck2Cutoff: pacing.pendingConfig.deck2Cutoff,
    pendingConfig: undefined,
  }
}

export function proposePacing(
  pacing: PacingScheduleConfig,
  deck1Cutoff: string,
  deck2Cutoff: string,
  warnings: readonly WarningId[],
  now = new Date(),
  today = localDateKey(),
): { ok: true; pacing: PacingScheduleConfig } | { ok: false; message: string } {
  if (clockMinutes(deck1Cutoff) === null || clockMinutes(deck2Cutoff) === null) {
    return { ok: false, message: 'Use 24-hour times like 13:00.' }
  }
  if (warnings.length > 0) return { ok: false, message: 'Cutoffs stay locked while a warning is active.' }
  if (cooldownRemaining(pacing, now) > 0) return { ok: false, message: 'Cutoffs can change again after the 48-hour cooldown.' }
  return {
    ok: true,
    pacing: {
      ...pacing,
      lastModified: now.toISOString(),
      pendingConfig: { deck1Cutoff, deck2Cutoff, effectiveDate: shiftDateKey(today, 1) },
    },
  }
}

const ESTABLISHED_JOIN = '1970-01-01T00:00:00.000Z'

export function resolveJoinedAt(
  state: Pick<PulseState, 'joinedAt' | 'lastAuditDate' | 'transactions' | 'forgeStreak' | 'chainStreak' | 'habitDay' | 'lastChainCompletedDate' | 'lastForgeCompletedDate'>,
  now = new Date(),
): string {
  if (state.joinedAt) return state.joinedAt
  const today = localDateKey(now)
  const usedBefore = state.lastAuditDate < today
    || state.transactions.length > 0
    || state.forgeStreak > 0
    || state.chainStreak > 0
    || state.habitDay.completedIds.length > 0
    || state.habitDay.date < today
    || Boolean(state.lastChainCompletedDate)
    || Boolean(state.lastForgeCompletedDate)
  return usedBefore ? ESTABLISHED_JOIN : now.toISOString()
}

export function excusedJoinWarnings(joinedAt: string, pacing: PacingScheduleConfig): WarningId[] {
  const joined = new Date(joinedAt)
  if (Number.isNaN(joined.getTime())) return []
  const excused: WarningId[] = []
  if (pastCutoff(pacing.deck1Cutoff, joined)) excused.push('deck1')
  if (pastCutoff(pacing.deck2Cutoff, joined)) excused.push('deck2')
  if (minutesUntilCutoff(pacing.auditCutoff, joined) < 120) excused.push('deck3')
  return excused
}

function excuseJoinDay(habitDay: HabitDay, joinedAt: string, pacing: PacingScheduleConfig): HabitDay {
  const joined = new Date(joinedAt)
  if (Number.isNaN(joined.getTime()) || habitDay.date !== localDateKey(joined)) return habitDay
  const missing = excusedJoinWarnings(joinedAt, pacing).filter((id) => !habitDay.clearedWarnings.includes(id))
  if (missing.length === 0) return habitDay
  return { ...habitDay, clearedWarnings: [...habitDay.clearedWarnings, ...missing] }
}

export function dueWarnings(
  decks: readonly HabitDeck[],
  completedIds: readonly string[],
  cleared: readonly WarningId[],
  pacing: PacingScheduleConfig,
  earned: number,
  goal: number,
  now = new Date(),
): WarningId[] {
  const next: WarningId[] = []
  if (pastCutoff(pacing.deck1Cutoff, now) && !deckComplete(decks[0], completedIds)) next.push('deck1')
  if (pastCutoff(pacing.deck2Cutoff, now) && !deckComplete(decks[1], completedIds)) next.push('deck2')
  const critical = !deckComplete(decks[2], completedIds) && earned < goal * 0.5 && minutesUntilCutoff(pacing.auditCutoff, now) < 120
  if (critical) next.push('deck3')
  return next.filter((id) => !cleared.includes(id))
}

export function closedDayWarnings(
  decks: readonly HabitDeck[],
  completedIds: readonly string[],
  cleared: readonly WarningId[],
  earned: number,
  goal: number,
): WarningId[] {
  const next: WarningId[] = []
  if (!deckComplete(decks[0], completedIds)) next.push('deck1')
  if (!deckComplete(decks[1], completedIds)) next.push('deck2')
  if (!deckComplete(decks[2], completedIds) && earned < goal * 0.5) next.push('deck3')
  return next.filter((id) => !cleared.includes(id))
}

export function shaveWarning(state: PulseState): PulseState {
  const active = WARNING_ORDER.find((id) => state.warnings.includes(id))
  if (!active) return state
  return {
    ...state,
    warnings: state.warnings.filter((id) => id !== active),
    habitDay: {
      ...state.habitDay,
      clearedWarnings: state.habitDay.clearedWarnings.includes(active)
        ? state.habitDay.clearedWarnings
        : [...state.habitDay.clearedWarnings, active],
    },
  }
}

export function clearDeckWarning(state: PulseState, deckIndex: number): PulseState {
  const id = WARNING_ORDER[deckIndex]
  if (!id || !state.warnings.includes(id)) return state
  return {
    ...state,
    warnings: state.warnings.filter((item) => item !== id),
    habitDay: {
      ...state.habitDay,
      clearedWarnings: state.habitDay.clearedWarnings.includes(id)
        ? state.habitDay.clearedWarnings
        : [...state.habitDay.clearedWarnings, id],
    },
  }
}

export function settleDiscipline(state: PulseState, day: string, earned: number): PulseState {
  const progress = state.habitDay.date === day ? state.habitDay : { date: day, completedIds: [], clearedWarnings: [], shielded: false }
  if (progress.shielded) {
    return { ...state, warnings: [], chainStreak: state.chainStreak }
  }
  const goal = forgeTarget(state.transactions, day)
  const warnings = closedDayWarnings(state.decks, progress.completedIds, progress.clearedWarnings, earned, goal)
  const decksDone = allDecksComplete(state.decks, progress.completedIds)
  let chainStreak = decksDone ? state.chainStreak + 1 : state.chainStreak
  let lastChainCompletedDate = decksDone ? day : state.lastChainCompletedDate
  let ptoCadence = state.ptoCadence
  let ptoTokens = state.ptoTokens
  let forgeStreak = state.forgeStreak
  let discountFrozenUntil = state.discountFrozenUntil
  let transactions = state.transactions
  if (warnings.length === 0) {
    ptoCadence += 1
    if (ptoCadence >= 7) {
      const capacity = perkTier(chainStreak, forgeStreak).capacity
      if (ptoTokens < capacity) ptoTokens += 1
      ptoCadence = 0
    }
  }
  if (warnings.length === 3) {
    chainStreak = 0
    forgeStreak = 0
    lastChainCompletedDate = state.lastChainCompletedDate
    const missed = unfinishedHabits(state.decks, progress.completedIds)
    const penalty = missed * 20
    const collected = Math.min(penalty, Math.max(0, state.balance))
    transactions = [
      {
        id: `tx-elim-${day}`,
        type: 'SPEND',
        title: 'Elimination: Unfinished habits',
        points: penalty,
        category: 'Decay Audit',
        is_locked: true,
        reasoning: `Three warnings were still open. Collected ${collected} PTS of the ${penalty} PTS fee.`,
        timestamp: new Date(`${day}T23:59:00`).toISOString(),
        date: day,
      },
      ...transactions,
    ]
    return {
      ...state,
      balance: state.balance - collected,
      transactions,
      warnings: [],
      chainStreak,
      forgeStreak,
      streakCount: forgeStreak,
      lastChainCompletedDate,
      lastForgeCompletedDate: '',
      streakState: 'STALLED',
      ptoCadence,
      ptoTokens,
      discountFrozenUntil,
    }
  }
  if (warnings.length > 0) {
    discountFrozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
  return { ...state, warnings: [], chainStreak, forgeStreak, streakCount: forgeStreak, lastChainCompletedDate, ptoCadence, ptoTokens, discountFrozenUntil, transactions }
}

export function syncLiveDiscipline(state: PulseState, now = new Date()): PulseState {
  const today = localDateKey(now)
  const pacing = { ...applyPendingPacing(state.pacing, today), auditCutoff: perkTier(state.chainStreak, state.forgeStreak).auditCutoff }
  const waitingOnAudit = state.habitDay.date < today && state.lastAuditDate <= state.habitDay.date
  const joinedAt = resolveJoinedAt(state, now)
  const habitDay = excuseJoinDay(
    state.habitDay.date === today || waitingOnAudit
      ? state.habitDay
      : { date: today, completedIds: [] as string[], clearedWarnings: [] as WarningId[], shielded: false },
    joinedAt,
    pacing,
  )
  if (habitDay.date !== today) return { ...state, joinedAt, pacing, habitDay }
  const earned = earnedOn(state.transactions, today)
  const warnings = dueWarnings(state.decks, habitDay.completedIds, habitDay.clearedWarnings, pacing, earned, forgeTarget(state.transactions, today), now)
  return { ...state, joinedAt, pacing, habitDay, warnings }
}
