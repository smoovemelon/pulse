import { useNotice } from '../../hooks/useNotice'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { Surface } from '../Common/primitives'
import { AnchorCard } from './AnchorCard'
import { BalanceDisplay } from './BalanceDisplay'
import { ProfilePhoto } from './ProfilePhoto'
import { SplitCapsule } from './MomentumBar'
import { StreakBadge } from './StreakBadge'

export function Dashboard({ onEditAnchor }: { readonly onEditAnchor: () => void }) {
  const economy = usePulseEconomy()
  const { anchor, avatar, saveAvatar } = useSettings()
  const { feedback } = useSensory()
  const { notify } = useNotice()

  return (
    <>
      <Surface data-tour="balance" className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <BalanceDisplay balance={economy.balance} />
          <ProfilePhoto
            avatar={avatar}
            onChange={(dataUrl) => saveAvatar(dataUrl)}
            onError={() => {
              feedback('error')
              notify('Choose an image')
            }}
          />
        </div>
        <AnchorCard
          anchor={anchor}
          onEdit={() => {
            feedback('click')
            onEditAnchor()
          }}
        />
      </Surface>
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
