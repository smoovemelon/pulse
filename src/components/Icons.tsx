import type { ReactNode } from 'react'

type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export function VolumeOn({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 10v4h2.8l3.7 3V7l-3.7 3H4.5z" />
      <path d="M14.2 9.4a3.2 3.2 0 0 1 0 5.2" />
      <path d="M16.4 7.4a6 6 0 0 1 0 9.2" />
    </Svg>
  )
}

export function VolumeOff({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 10v4h2.8l3.7 3V7l-3.7 3H4.5z" />
      <line x1="15.5" y1="10" x2="19.5" y2="14" />
      <line x1="19.5" y1="10" x2="15.5" y2="14" />
    </Svg>
  )
}

export function GuideIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.8 9.6a2.3 2.3 0 1 1 3.5 1.9c-.6.4-1.1.9-1.1 1.7" />
      <circle cx="12" cy="16.2" r="0.7" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function SettingsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function BoltIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={`${className} fill-current stroke-current`} viewBox="0 0 24 24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export function FlameIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

export function AnchorIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v14" />
      <path d="M8 10h8" />
      <path d="M12 20.5c-3.4 0-5.6-1.6-6.6-4" />
      <path d="M12 20.5c3.4 0 5.6-1.6 6.6-4" />
    </Svg>
  )
}

export function MorningIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4.2v1.8" />
      <path d="M12 18v1.8" />
      <path d="M4.2 12h1.8" />
      <path d="M18 12h1.8" />
      <path d="M6.4 6.4l1.3 1.3" />
      <path d="M16.3 16.3l1.3 1.3" />
      <path d="M17.6 6.4l-1.3 1.3" />
      <path d="M7.7 16.3l-1.3 1.3" />
    </Svg>
  )
}

export function MiddayIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="11" r="3" />
      <path d="M12 4.5v1.6" />
      <path d="M5.2 11h1.6" />
      <path d="M17.2 11h1.6" />
      <path d="M6.8 6l1.2 1.2" />
      <path d="M16 6l-1.2 1.2" />
      <path d="M5 18.5h14" />
    </Svg>
  )
}

export function EveningIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16.2 14.2A6.2 6.2 0 0 1 9.6 6.4 6.4 6.4 0 1 0 16.2 14.2z" />
      <path d="M16.5 5.2l.4 1.5 1.5.4-1.5.4-.4 1.5-.4-1.5-1.5-.4 1.5-.4z" />
    </Svg>
  )
}

export function CloseIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  )
}

export function PlusIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <Svg className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  )
}

export function MinusIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  )
}

export function ClockIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Svg>
  )
}

export function SparkleIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
    </Svg>
  )
}

export function FeedIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </Svg>
  )
}

export function VaultIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" />
    </Svg>
  )
}

export function AlertIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  )
}

export function InfoIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  )
}

export function CheckIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  )
}

export function DownloadIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </Svg>
  )
}

export function UploadIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </Svg>
  )
}

export function ChevronIcon({ className = '', up = false }: IconProps & { up?: boolean }) {
  return (
    <Svg className={`w-3.5 h-3.5 shrink-0 ${className}`}>
      {up ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </Svg>
  )
}

export function EditIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  )
}

export function TrashIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </Svg>
  )
}

export function SunIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 4v1.8M12 18.2V20M4 12h1.8M18.2 12H20M6.2 6.2l1.3 1.3M16.5 16.5l1.3 1.3M17.8 6.2l-1.3 1.3M7.5 16.5l-1.3 1.3" />
    </Svg>
  )
}

export function MoonIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M19.5 14.2A7.2 7.2 0 1 1 9.8 4.5a6 6 0 0 0 9.7 9.7z" />
    </Svg>
  )
}

export function GamingIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="6" />
    </Svg>
  )
}

export function ItemsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </Svg>
  )
}

export function DiningIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 17h18" />
      <path d="M5 17c0-4.4 3.1-8 7-8s7 3.6 7 8" />
      <circle cx="12" cy="6" r="1.5" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </Svg>
  )
}

export function EventsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </Svg>
  )
}

export function FoodIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 3v6" />
      <path d="M12 3v6" />
      <path d="M17 3v6" />
      <path d="M7 9h10" />
      <path d="M12 9v12" />
    </Svg>
  )
}

export function StatsIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 19V10" />
      <path d="M10 19V5" />
      <path d="M16 19v-6" />
      <path d="M3 19h18" />
    </Svg>
  )
}

export function FoundationIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 8h16" />
      <path d="M6 12h12" />
      <path d="M8 16h8" />
    </Svg>
  )
}

export function CategoryIcon({ kind, className = 'w-4 h-4' }: IconProps & { kind: 'gaming' | 'food' | 'items' | 'events' }) {
  if (kind === 'gaming') return <GamingIcon className={className} />
  if (kind === 'food') return <FoodIcon className={className} />
  if (kind === 'events') return <EventsIcon className={className} />
  return <ItemsIcon className={className} />
}
