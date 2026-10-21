export function MomentumGauge({
  earned,
  goal,
  percent,
}: {
  readonly earned: number
  readonly goal: number
  readonly percent: number
}) {
  const size = 200
  const stroke = 16
  const radius = (size - stroke) / 2 - 4
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const gap = circumference * 0.25
  const track = circumference - gap
  const clamped = Math.max(0, Math.min(100, percent))
  const progress = track * (clamped / 100)
  const sweep = ((135 + 270 * (clamped / 100)) * Math.PI) / 180
  const knobX = center + radius * Math.cos(sweep)
  const knobY = center + radius * Math.sin(sweep)

  return (
    <div className="relative mx-auto h-[200px] w-[200px]">
      <svg
        data-testid="momentum-bar"
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full"
        role="img"
        aria-label={`${earned} of ${goal} daily goal, ${clamped}%`}
      >
        <g transform={`rotate(135 ${center} ${center})`}>
          <circle
            className="momentum-track"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${track} ${gap}`}
          />
          {clamped > 0 && (
            <circle
              className="momentum-progress"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
            />
          )}
        </g>
        {clamped > 0 && (
          <>
            <circle className="momentum-knob-ring" cx={knobX} cy={knobY} r={stroke * 0.64} />
            <circle className="momentum-knob" cx={knobX} cy={knobY} r={stroke * 0.5} />
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="flex items-end font-num leading-none tracking-tight text-ink">
          <span data-testid="today-earned" className="text-5xl font-extrabold">
            {clamped}
          </span>
          <span className="mb-1 ml-0.5 text-lg font-bold text-muted">%</span>
        </span>
        <span className="mt-1.5 text-sm font-semibold text-muted">{earned >= goal ? 'Goal met' : 'Daily goal'}</span>
      </div>
    </div>
  )
}
