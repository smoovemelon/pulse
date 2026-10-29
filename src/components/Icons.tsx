import type { ReactNode } from 'react'

type IconProps = { className?: string }

function Svg({ className, children, strokeWidth = 2 }: IconProps & { children: ReactNode; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export function VolumeOn({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <path d="M4.5 8.7h3.1L12.1 4.4v15.2L7.6 15.3H4.5z" />
      <path d="M14.8 9.6a3 3 0 0 1 0 4.8" />
      <path d="M17.2 8.5a4.2 4.2 0 0 1 0 7" />
    </Svg>
  )
}

export function VolumeOff({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <path d="M4.5 8.7h3.1L12.1 4.4v15.2L7.6 15.3H4.5z" />
      <path d="M14.8 8.4 19.4 15.6" />
      <path d="M19.4 8.4 14.8 15.6" />
    </Svg>
  )
}

export function GuideIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <circle cx="12" cy="12" r="7.75" />
      <path d="M9.7 9.65a2.4 2.4 0 1 1 3.55 2.1C12.45 12.2 12 12.75 12 13.7" />
      <circle cx="12" cy="16.2" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function SettingsIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <path d="M10.52 4.39h2.96l.38 2.49 1.64.95 2.35-.91 1.48 2.56-1.96 1.57v1.9l1.96 1.57-1.48 2.56-2.35-.91-1.64.95-.38 2.49h-2.96l-.38-2.49-1.64-.95-2.35.91-1.48-2.56 1.96-1.57v-1.9l-1.96-1.57 1.48-2.56 2.35.91 1.64-.95z" />
      <circle cx="12" cy="12" r="2.45" />
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
      <circle cx="12" cy="12" r="2.7" />
      <path d="M12 2.6v2.3" />
      <path d="M12 19.1v2.3" />
      <path d="M2.6 12h2.3" />
      <path d="M19.1 12h2.3" />
      <path d="M5.2 5.2l1.6 1.6" />
      <path d="M17.2 17.2l1.6 1.6" />
      <path d="M18.8 5.2l-1.6 1.6" />
      <path d="M6.8 17.2l-1.6 1.6" />
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
    <Svg className={className} strokeWidth={1.85}>
      <rect x="4.75" y="4.25" width="14.5" height="15.5" rx="3" />
      <path d="M8 9.15h8M8 12.15h8M8 15.15h8" />
    </Svg>
  )
}

export function VaultIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <rect x="5.25" y="10.5" width="13.5" height="9" rx="2.2" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
      <circle cx="12" cy="15" r="1" fill="currentColor" stroke="none" />
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

export function InfoIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <circle cx="12" cy="12" r="7.75" />
      <path d="M12 11v5.15" />
      <circle cx="12" cy="8.15" r="0.9" fill="currentColor" stroke="none" />
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

export function SunIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <circle cx="12" cy="12" r="3.15" />
      <path d="M12 4.25v2.55M12 17.2v2.55M4.25 12h2.55M17.2 12h2.55M6.55 6.55l1.8 1.8M15.65 15.65l1.8 1.8M17.45 6.55l-1.8 1.8M8.35 15.65l-1.8 1.8" />
    </Svg>
  )
}

export function MoonIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <path fill="currentColor" stroke="none" transform="rotate(-36 12 12)" d="M18.2 6.1a7.6 7.6 0 1 0 0 11.8 5.7 5.7 0 0 1 0-11.8z" />
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
    <Svg className={className} strokeWidth={1.85}>
      <path d="M5 19.25h14" />
      <path d="M7.5 18V10.5" />
      <path d="M12 18V4.75" />
      <path d="M16.5 18V12.5" />
    </Svg>
  )
}

export function FoundationIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <rect x="4.75" y="4.25" width="14.5" height="3.6" rx="1.8" />
      <rect x="4.75" y="10.2" width="14.5" height="3.6" rx="1.8" />
      <rect x="4.75" y="16.15" width="14.5" height="3.6" rx="1.8" />
    </Svg>
  )
}

export function ProfileIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <Svg className={className} strokeWidth={1.85}>
      <circle cx="12" cy="8.6" r="3" />
      <path d="M5.4 19.2a6.6 6.6 0 0 1 13.2 0" />
    </Svg>
  )
}

export function CategoryIcon({ kind, className = 'w-4 h-4' }: IconProps & { kind: 'gaming' | 'food' | 'items' | 'events' }) {
  if (kind === 'gaming') return <GamingIcon className={className} />
  if (kind === 'food') return <FoodIcon className={className} />
  if (kind === 'events') return <EventsIcon className={className} />
  return <ItemsIcon className={className} />
}
