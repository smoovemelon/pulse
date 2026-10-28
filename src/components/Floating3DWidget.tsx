import { useRef, useState, type PointerEvent } from 'react'
import cat from '../assets/hash-pronn.png'

const ASPECT = 553 / 420

export function Floating3DWidget({
  size = 120,
  speed = 1,
  intensity = 1,
  hoverPause = true,
  tilt = false,
  className = '',
}: {
  readonly size?: number
  readonly speed?: number
  readonly intensity?: number
  readonly hoverPause?: boolean
  readonly tilt?: boolean
  readonly className?: string
}) {
  const hit = useRef<HTMLDivElement>(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const spin = Math.max(speed, 0.2)
  const lift = Math.max(intensity, 0)

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!tilt || reduced) return
    const node = hit.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    node.style.setProperty('--tilt-x', `${(-y * 14).toFixed(2)}deg`)
    node.style.setProperty('--tilt-y', `${(x * 16).toFixed(2)}deg`)
  }

  const onLeave = () => {
    hit.current?.style.setProperty('--tilt-x', '0deg')
    hit.current?.style.setProperty('--tilt-y', '0deg')
  }

  return (
    <div
      className={`float-3d ${className}`}
      style={{ width: size, height: Math.round(size * ASPECT) }}
      data-testid="floating-3d"
      aria-hidden="true"
    >
      <div
        ref={hit}
        className={`float-3d-hit ${hoverPause ? 'float-3d-pause' : ''}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div
          className="float-3d-bob"
          style={{ ['--float-intensity' as string]: reduced ? 0 : lift, ['--spin-speed' as string]: spin }}
        >
          <div className="float-3d-spin">
            <img src={cat} alt="" draggable={false} className="float-3d-face" />
            <img src={cat} alt="" draggable={false} className="float-3d-face float-3d-back" />
          </div>
        </div>
      </div>
    </div>
  )
}
