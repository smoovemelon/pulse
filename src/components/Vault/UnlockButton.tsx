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
      className="inline-flex h-8 items-center justify-center leading-none px-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap active:scale-95"
    >
      {canAfford ? 'Unlock Reward' : `${percent}% Funded`}
    </Button>
  )
}
