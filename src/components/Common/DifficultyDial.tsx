import { useSettings } from '../../hooks/useSettings'
import { Button } from './Button'

export function DifficultyDial() {
  const { economy, saveDifficulty, difficultyLocked } = useSettings()

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {(['lenient', 'balanced', 'hardcore'] as const).map((level) => {
          const current = economy.difficulty === level
          return (
            <Button
              key={level}
              tone={current ? 'pillActive' : 'pill'}
              disabled={difficultyLocked && !current}
              onClick={() => saveDifficulty(level)}
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
    </div>
  )
}
