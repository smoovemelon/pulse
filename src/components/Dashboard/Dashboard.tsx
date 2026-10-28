import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { Surface } from '../Common/primitives'
import { FloatingCat } from '../FloatingCat'
import { AnchorCard } from './AnchorCard'
import { BalanceDisplay } from './BalanceDisplay'
import { SplitCapsule } from './MomentumBar'
import { StreakBadge } from './StreakBadge'

export function Dashboard({ onEditAnchor }: { readonly onEditAnchor: () => void }) {
  const economy = usePulseEconomy()
  const { anchor } = useSettings()
  const { feedback } = useSensory()

  return (
    <>
      <div className="relative">
        <FloatingCat />
        <Surface data-tour="balance" className="relative z-10 flex flex-col gap-4 p-5">
          <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-zinc-200/40 to-transparent blur-2xl" />
          <div className="relative">
            <BalanceDisplay balance={economy.balance} />
          </div>
          <AnchorCard
            anchor={anchor}
            onEdit={() => {
              feedback('click')
              onEditAnchor()
            }}
          />
        </Surface>
      </div>
      <Surface data-tour="day" className="flex flex-col gap-3 p-4">
        <SplitCapsule
          earned={economy.todayEarned}
          goal={economy.dailyGoal}
          decksComplete={economy.decksComplete}
          forgeStreak={economy.forgeStreak}
          chainStreak={economy.chainStreak}
          tier={economy.tier}
          discountPercent={economy.discountPercent}
        />
        <StreakBadge
          streak={economy.streak}
          multiplier={economy.streakMultiplier}
          state={economy.streakState}
          status={economy.streakStatus}
          week={economy.week}
          goal={economy.dailyGoal}
        />
      </Surface>
    </>
  )
}
