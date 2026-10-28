import cat from '../assets/hash-pronn.png'

export function FloatingCat() {
  return (
    <img
      src={cat}
      alt=""
      data-testid="floating-cat"
      className="cat-float pointer-events-none absolute -top-9 right-2 z-20 w-[88px]"
    />
  )
}
