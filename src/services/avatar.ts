const OUTPUT = 256

export function avatarFrame(
  imageWidth: number,
  imageHeight: number,
  view: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const scale = Math.max(view / imageWidth, view / imageHeight) * Math.min(3, Math.max(1, zoom))
  const width = imageWidth * scale
  const height = imageHeight * scale
  const maxX = Math.max(0, (width - view) / 2)
  const maxY = Math.max(0, (height - view) / 2)
  return {
    scale,
    width,
    height,
    x: Math.min(maxX, Math.max(-maxX, offsetX)),
    y: Math.min(maxY, Math.max(-maxY, offsetY)),
  }
}

export function renderAvatar(
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  view: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
): string {
  const frame = avatarFrame(imageWidth, imageHeight, view, zoom, offsetX, offsetY)
  const ratio = OUTPUT / view
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT
  canvas.height = OUTPUT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Choose an image')
  ctx.drawImage(
    image,
    (OUTPUT - frame.width * ratio) / 2 + frame.x * ratio,
    (OUTPUT - frame.height * ratio) / 2 + frame.y * ratio,
    frame.width * ratio,
    frame.height * ratio,
  )
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function prepareAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Choose an image'))
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Choose an image'))
        return
      }
      const scale = Math.max(size / image.width, size / image.height)
      const width = image.width * scale
      const height = image.height * scale
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Choose an image'))
    }
    image.src = url
  })
}
