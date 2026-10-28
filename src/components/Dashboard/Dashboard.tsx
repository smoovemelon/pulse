import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { AnchorCard } from './AnchorCard'
import { BalanceDisplay } from './BalanceDisplay'
import { Floating3DWidget } from '../Floating3DWidget'
import { SplitCapsule } from './MomentumBar'
import { StreakBadge } from './StreakBadge'

export function Dashboard({ onEditAnchor }: { readonly onEditAnchor: () => void }) {
  const economy = usePulseEconomy()
  const { anchor } = useSettings()
  const { feedback } = useSensory()

  return (
    <>
    <div className="relative">
    <Floating3DWidget className="absolute top-0 left-1/2 z-0 -translate-x-1/2" size={168} speed={0.75} intensity={1.2} hoverPause tilt />
    <section className="depth-card relative z-10 mt-28 rounded-[28px] p-5 flex flex-col gap-4 overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-zinc-200/40 to-transparent rounded-full blur-2xl pointer-events-none" />
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
    </section>
    </div>
    <section className="depth-card rounded-[28px] p-4 flex flex-col gap-3">
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
    </section>
    </>
  )
}
