import { Button } from '../Common/Button'

export function UnlockButton({
  canAfford,
  percent,
  testId,
  onClick,
}: {
  readonly canAfford: boolean
  readonly percent: number
  readonly testId: string
  readonly onClick: () => void
}) {
  return (
    <Button
      tone={canAfford ? 'dark' : 'muted'}
      data-testid={testId}
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
    >
      {canAfford ? 'Unlock Reward' : `${percent}% Funded`}
    </Button>
  )
}
