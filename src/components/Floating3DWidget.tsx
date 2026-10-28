import { Canvas, useFrame } from '@react-three/fiber'
import { Float, useTexture } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import cat from '../assets/hash-pronn.png'

const ASPECT = 553 / 420

export function Floating3DWidget({
  size = 120,
  speed = 1,
  className = '',
}: {
  readonly size?: number
  readonly speed?: number
  readonly className?: string
}) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  return (
    <div
      className={className}
      style={{ width: size, height: Math.round(size * ASPECT) }}
      data-testid="floating-3d"
      aria-hidden="true"
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0.04, 4.15], fov: 30 }}
        dpr={[1, 1.75]}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <ambientLight intensity={1.05} />
        <directionalLight position={[2.4, 3.1, 4.2]} intensity={2.1} />
        <directionalLight position={[-2.2, 0.8, -3.6]} intensity={1.15} />
        <Suspense fallback={null}>
          <CatScene speed={speed} reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function CatScene({ speed, reduced }: { readonly speed: number; readonly reduced: boolean }) {
  return (
    <Float speed={1.5} rotationIntensity={reduced ? 0 : 0.22} floatIntensity={reduced ? 0 : 0.5} enabled={!reduced}>
      <group rotation={[-0.28, 0.18, 0]}>
        <Spinner speed={speed} reduced={reduced}>
          <CatMesh />
        </Spinner>
      </group>
    </Float>
  )
}

function Spinner({
  speed,
  reduced,
  children,
}: {
  readonly speed: number
  readonly reduced: boolean
  readonly children: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (reduced || !group.current) return
    group.current.rotation.y += delta * 0.55 * speed
  })
  return <group ref={group}>{children}</group>
}

function CatMesh() {
  const texture = useTexture(cat)
  const geometry = useMemo(() => buildCatGeometry(texture.image as HTMLImageElement), [texture])
  const materials = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
    const face = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.58,
      metalness: 0.02,
    })
    const side = new THREE.MeshStandardMaterial({
      color: '#f4f4f5',
      roughness: 0.82,
      metalness: 0,
    })
    return [face, side]
  }, [texture])

  return <mesh geometry={geometry} material={materials} />
}

function buildCatGeometry(image: HTMLImageElement): THREE.BufferGeometry {
  const outline = traceOutline(image)
  const shape = new THREE.Shape(outline.length > 8 ? outline : fallbackOutline())
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.018,
    bevelSegments: 2,
    curveSegments: 1,
  })
  paintCapUvs(geometry)
  geometry.computeVertexNormals()
  geometry.center()
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox
  if (bounds) {
    const height = bounds.max.y - bounds.min.y
    const fit = height > 0 ? 2.15 / height : 1
    geometry.scale(fit, fit, fit)
  }
  return geometry
}

function fallbackOutline(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.15, 0.05),
    new THREE.Vector2(0.85, 0.05),
    new THREE.Vector2(0.85, 1.2),
    new THREE.Vector2(0.15, 1.2),
  ]
}

function paintCapUvs(geometry: THREE.ExtrudeGeometry) {
  const position = geometry.attributes.position
  const uv = geometry.attributes.uv
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let index = 0; index < position.count; index += 1) {
    minX = Math.min(minX, position.getX(index))
    maxX = Math.max(maxX, position.getX(index))
    minY = Math.min(minY, position.getY(index))
    maxY = Math.max(maxY, position.getY(index))
  }
  const spanX = Math.max(0.0001, maxX - minX)
  const spanY = Math.max(0.0001, maxY - minY)
  for (let index = 0; index < position.count; index += 1) {
    uv.setXY(index, (position.getX(index) - minX) / spanX, (position.getY(index) - minY) / spanY)
  }
  uv.needsUpdate = true
}

function traceOutline(image: HTMLImageElement): THREE.Vector2[] {
  const cols = 110
  const rows = Math.max(1, Math.round(image.height * (cols / Math.max(1, image.width))))
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return []
  context.drawImage(image, 0, 0, cols, rows)
  const { data } = context.getImageData(0, 0, cols, rows)
  const solid = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return false
    return data[(y * cols + x) * 4 + 3] > 40
  }

  let startX = -1
  let startY = -1
  for (let y = 0; y < rows && startX < 0; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (solid(x, y)) {
        startX = x
        startY = y
        break
      }
    }
  }
  if (startX < 0) return []

  const steps = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ]
  const raw: Array<[number, number]> = []
  let x = startX
  let y = startY
  let search = 6
  const limit = cols * rows * 2
  for (let count = 0; count < limit; count += 1) {
    raw.push([x, y])
    let moved = false
    for (let turn = 0; turn < 8; turn += 1) {
      const direction = (search + turn) % 8
      const nextX = x + steps[direction][0]
      const nextY = y + steps[direction][1]
      if (!solid(nextX, nextY)) continue
      search = (direction + 6) % 8
      x = nextX
      y = nextY
      moved = true
      break
    }
    if (!moved) break
    if (x === startX && y === startY && raw.length > 8) break
  }

  const step = Math.max(1, Math.floor(raw.length / 140))
  const points = raw.filter((_, index) => index % step === 0).map(([px, py]) => new THREE.Vector2(px / cols, (rows - py) / cols))
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length]
    area += points[index].x * next.y - next.x * points[index].y
  }
  if (area < 0) points.reverse()
  return points
}
