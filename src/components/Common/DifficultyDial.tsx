import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import type { EconomyDifficulty } from '../../types'
import { Button } from './Button'

const LEVELS: readonly EconomyDifficulty[] = ['lenient', 'balanced', 'hardcore']

export function DifficultyDial() {
  const { economy, saveDifficulty, difficultyLocked } = useSettings()
  const [pending, setPending] = useState<EconomyDifficulty | null>(null)
  const shown = pending ?? economy.difficulty
  const dirty = pending !== null && pending !== economy.difficulty

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => {
          const current = economy.difficulty === level
          return (
            <Button
              key={level}
              tone={shown === level ? 'pillActive' : 'pill'}
              disabled={difficultyLocked && !current}
              onClick={() => setPending(current ? null : level)}
              className="rounded-xl py-2 text-[10px] font-extrabold uppercase disabled:opacity-40"
            >
              {level}
            </Button>
          )
        })}
      </div>
      <p className="text-[10px] font-bold text-faint">
        {economy.timeMultiplier} PTS/hr · {economy.cashMultiplier} PTS/$
        {difficultyLocked ? ' · Start fresh to change' : ' · One free change'}
      </p>
      {dirty && (
        <div className="grid grid-cols-2 gap-2">
          <Button tone="card" onClick={() => setPending(null)} className="rounded-xl py-2.5 text-[11px] font-extrabold">
            Cancel
          </Button>
          <Button
            tone="dark"
            onClick={() => {
              if (!pending) return
              saveDifficulty(pending)
              setPending(null)
            }}
            className="rounded-xl py-2.5 text-[11px] font-extrabold"
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  )
}
