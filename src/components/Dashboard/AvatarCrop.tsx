import { useRef, useState } from 'react'
import { avatarFrame, renderAvatar } from '../../services/avatar'
import { Button } from '../Common/Button'
import { Eyebrow } from '../Common/primitives'

const VIEW = 224

export function AvatarCrop({
  image,
  onCancel,
  onSave,
}: {
  readonly image: HTMLImageElement
  readonly onCancel: () => void
  readonly onSave: (dataUrl: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const frame = avatarFrame(image.naturalWidth, image.naturalHeight, VIEW, zoom, offset.x, offset.y)

  const move = (clientX: number, clientY: number) => {
    const start = drag.current
    if (!start) return
    const next = avatarFrame(
      image.naturalWidth,
      image.naturalHeight,
      VIEW,
      zoom,
      start.ox + clientX - start.x,
      start.oy + clientY - start.y,
    )
    setOffset({ x: next.x, y: next.y })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-heading">
      <div className="flex w-full max-w-[360px] flex-col gap-4 rounded-[32px] border border-line bg-card p-6 text-ink shadow-2xl">
        <div>
          <Eyebrow className="mb-1 block">Photo</Eyebrow>
          <h3 id="avatar-crop-heading" className="heading-athletic text-xl">Frame your photo</h3>
        </div>
        <p className="text-sm font-semibold leading-relaxed text-body">Drag the picture inside the circle. The slider zooms in.</p>
        <div
          className="relative mx-auto h-56 w-56 touch-none overflow-hidden rounded-full border border-line bg-well"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
          }}
          onPointerMove={(event) => move(event.clientX, event.clientY)}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
          }}
        >
          <img
            src={image.src}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none"
            style={{
              width: frame.width,
              height: frame.height,
              left: (VIEW - frame.width) / 2 + frame.x,
              top: (VIEW - frame.height) / 2 + frame.y,
            }}
          />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow eyebrow-muted">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            aria-label="Zoom photo"
            style={{ background: `linear-gradient(90deg, #10b981 ${((zoom - 1) / 2) * 100}%, var(--line) ${((zoom - 1) / 2) * 100}%)` }}
            onChange={(event) => {
              const nextZoom = Number(event.target.value)
              const next = avatarFrame(image.naturalWidth, image.naturalHeight, VIEW, nextZoom, offset.x, offset.y)
              setZoom(nextZoom)
              setOffset({ x: next.x, y: next.y })
            }}
            className="time-slider"
          />
        </label>
        <div className="flex gap-2">
          <Button tone="card" onClick={onCancel} className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold">
            Cancel
          </Button>
          <Button
            tone="dark"
            onClick={() => onSave(renderAvatar(image, image.naturalWidth, image.naturalHeight, VIEW, zoom, offset.x, offset.y))}
            className="flex-1 rounded-2xl py-3.5 text-xs font-extrabold"
          >
            Use this frame
          </Button>
        </div>
      </div>
    </div>
  )
}
