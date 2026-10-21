import { isNamedAnchor } from '../lib/dates'
import type { PulseState } from '../types'
import { hasSeenIntro } from './persistence'

export function shouldIntroduce(
  state: Pick<PulseState, 'balance' | 'transactions' | 'vaultItems' | 'disciplineAnchor'>,
): boolean {
  if (hasSeenIntro()) return false
  if (state.balance !== 0) return false
  if (state.transactions.length > 0) return false
  if (state.vaultItems.length > 0) return false
  if (isNamedAnchor(state.disciplineAnchor)) return false
  return true
}
