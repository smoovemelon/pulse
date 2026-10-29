import { prepareAvatar } from '../../services/avatar'
import { ProfileIcon } from '../Icons'

export function ProfilePhoto({
  avatar,
  onChange,
  onError,
  size = 'md',
  testId = 'avatar-input',
}: {
  readonly avatar: string
  readonly onChange: (dataUrl: string) => void
  readonly onError: () => void
  readonly size?: 'md' | 'lg'
  readonly testId?: string
}) {
  const box = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'

  return (
    <label
      aria-label="Choose profile photo"
      className={`relative flex ${box} shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line bg-well text-muted`}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover object-center" />
      ) : (
        <ProfileIcon className={size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'} />
      )}
      <input
        data-testid={testId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          void prepareAvatar(file).then(onChange).catch(onError)
        }}
      />
    </label>
  )
}
