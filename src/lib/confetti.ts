const COLORS = ['#10b981', '#34d399', '#f43f5e', '#fb7185', '#f59e0b', '#fbbf24', '#6366f1', '#818cf8', '#0ea5e9', '#38bdf8']

type Piece = {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  rot: number
  vr: number
  color: string
}

function piece(x: number, y: number, angle: number, speed: number): Piece {
  return {
    x,
    y,
    w: 6 + Math.random() * 5,
    h: 9 + Math.random() * 6,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.28,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

export function celebrate() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100;'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const paint = () => {
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.floor(window.innerWidth * ratio)
    canvas.height = Math.floor(window.innerHeight * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  paint()

  const width = window.innerWidth
  const height = window.innerHeight
  const pieces: Piece[] = []
  for (let i = 0; i < 70; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4
    pieces.push(piece(width * (0.15 + Math.random() * 0.7), height * 0.2, angle, 5 + Math.random() * 7))
  }
  for (let i = 0; i < 28; i += 1) {
    pieces.push(piece(width * 0.18, height * 0.72, -Math.PI / 2 + (Math.random() - 0.2) * 0.8, 8 + Math.random() * 6))
    pieces.push(piece(width * 0.82, height * 0.72, -Math.PI / 2 - (Math.random() - 0.2) * 0.8, 8 + Math.random() * 6))
  }

  let frame = 0
  const frames = 95
  const tick = () => {
    frame += 1
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    const fade = Math.max(0, 1 - frame / frames)
    for (const bit of pieces) {
      bit.vy += 0.16
      bit.vx *= 0.992
      bit.x += bit.vx
      bit.y += bit.vy
      bit.rot += bit.vr
      ctx.save()
      ctx.translate(bit.x, bit.y)
      ctx.rotate(bit.rot)
      ctx.globalAlpha = fade
      ctx.fillStyle = bit.color
      ctx.fillRect(-bit.w / 2, -bit.h / 2, bit.w, bit.h)
      ctx.restore()
    }
    if (frame < frames) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}
