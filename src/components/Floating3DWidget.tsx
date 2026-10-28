import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import cat from '../assets/hash-pronn.png'

const ASPECT = 553 / 420
const DEPTH = [-20, -10, 0, 10, 20]
const PULL_MAX = 180

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
  const root = useRef<HTMLDivElement>(null)
  const hit = useRef<HTMLDivElement>(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const spin = Math.max(speed, 0.2)
  const lift = Math.max(intensity, 0)

  useEffect(() => {
    const node = root.current
    if (!node) return
    let startY = 0
    let tracking = false
    let pointerId = -1
    let wheelPull = 0
    let settle = 0

    const apply = (pull: number, live: boolean) => {
      const amount = Math.min(Math.max(pull, 0), PULL_MAX)
      node.style.setProperty('--cat-scale', (1 + (amount / PULL_MAX) * 0.62).toFixed(3))
      node.classList.toggle('is-pulling', live && amount > 0)
    }

    const down = (event: PointerEvent) => {
      if (window.scrollY > 0 || document.body.style.overflow === 'hidden') return
      tracking = true
      startY = event.clientY
      pointerId = event.pointerId
    }
    const move = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== pointerId) return
      if (window.scrollY > 0) {
        tracking = false
        apply(0, false)
        return
      }
      apply(event.clientY - startY, true)
    }
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      tracking = false
      apply(0, false)
    }
    const wheel = (event: WheelEvent) => {
      if (window.scrollY > 0 || document.body.style.overflow === 'hidden' || event.deltaY >= 0) return
      wheelPull = Math.min(PULL_MAX, wheelPull + Math.min(48, -event.deltaY))
      apply(wheelPull, true)
      window.clearTimeout(settle)
      settle = window.setTimeout(() => {
        wheelPull = 0
        apply(0, false)
      }, 420)
    }

    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('wheel', wheel, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('wheel', wheel)
      window.clearTimeout(settle)
    }
  }, [])

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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
      ref={root}
      className={`float-3d ${className}`}
      style={{ width: size, height: Math.round(size * ASPECT) }}
      data-testid="floating-3d"
      aria-hidden="true"
    >
      <div className="float-3d-shadow" />
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
          <div className="float-3d-stage">
            <div className="float-3d-spin">
              {DEPTH.map((z) => (
                <img
                  key={z}
                  src={cat}
                  alt=""
                  draggable={false}
                  className="float-3d-face"
                  style={{ transform: `translateZ(${z}px)` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
