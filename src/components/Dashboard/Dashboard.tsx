import { useNotice } from '../../hooks/useNotice'
import { useHabits } from '../../hooks/useHabits'
import { usePulseEconomy } from '../../hooks/usePulseEconomy'
import { useSensory } from '../../hooks/useSensory'
import { useSettings } from '../../hooks/useSettings'
import { nextOpenHabit } from '../../services/engine'
import { Surface, Eyebrow } from '../Common/primitives'
import { AnchorCard } from './AnchorCard'
import { BalanceDisplay } from './BalanceDisplay'
import { ProfilePhoto } from './ProfilePhoto'
import { SplitCapsule } from './MomentumBar'
import { StreakBadge } from './StreakBadge'

export function Dashboard({
  onEditAnchor,
  onOpenFoundation,
}: {
  readonly onEditAnchor: () => void
  readonly onOpenFoundation: () => void
}) {
  const economy = usePulseEconomy()
  const habits = useHabits()
  const next = nextOpenHabit(habits.decks, habits.habitDay.completedIds)
  const { anchor, avatar, saveAvatar } = useSettings()
  const { feedback } = useSensory()
  const { notify } = useNotice()

  return (
    <Surface className="flex flex-col gap-4 p-5">
      <div data-tour="balance" className="flex flex-col gap-4">
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
      </div>
      <div data-tour="day" className="flex flex-col gap-3">
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
          state={economy.streakState}
          status={economy.streakStatus}
          week={economy.week}
          goal={economy.dailyGoal}
        />
        {next && (
          <button
            type="button"
            data-testid="next-habit"
            onClick={() => {
              feedback('click')
              onOpenFoundation()
            }}
            className="press focus-ring flex items-center justify-between gap-3 rounded-2xl border border-line bg-well px-3 py-2.5 text-left"
          >
            <span className="min-w-0">
              <Eyebrow>Next habit</Eyebrow>
              <span className="mt-0.5 block truncate text-xs font-extrabold text-ink">{next.habit.title}</span>
            </span>
            <span className="shrink-0 font-num text-[11px] font-extrabold text-muted">{next.habit.points} PTS</span>
          </button>
        )}
      </div>
    </Surface>
  )
}
