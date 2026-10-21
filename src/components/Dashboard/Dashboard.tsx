import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { AnchorCard } from './AnchorCard'
import { BalanceDisplay } from './BalanceDisplay'
import { MomentumGauge } from './MomentumBar'
import { StreakBadge } from './StreakBadge'

export function Dashboard({ onEditAnchor }: { readonly onEditAnchor: () => void }) {
  const economy = usePulseEconomy()
  const { anchor } = useSettings()
  const { feedback } = useSensory()

  return (
    <section className="depth-card rounded-[28px] p-5 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-zinc-200/40 to-transparent rounded-full blur-2xl pointer-events-none" />
      <MomentumGauge earned={economy.todayEarned} goal={economy.dailyGoal} percent={economy.momentumPct} />
      <div className="relative grid grid-cols-2 gap-3">
        <BalanceDisplay balance={economy.balance} />
        <StreakBadge streak={economy.streak} />
      </div>
      <AnchorCard
        anchor={anchor}
        onEdit={() => {
          feedback('click')
          onEditAnchor()
        }}
      />
    </section>
  )
}
