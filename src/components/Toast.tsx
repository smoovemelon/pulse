import { InfoIcon } from './Icons'
import { usePulse } from '../pulse/context'

export function Toast() {
  const { toast } = usePulse()
  if (!toast) return null

  return (
    <div className="fixed top-4 inset-x-0 z-[80] flex justify-center pointer-events-none px-4">
      <div className="px-4 py-2 bg-zinc-900/95 backdrop-blur-xl text-zinc-100 text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 border border-zinc-700/50">
        <InfoIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>{toast}</span>
      </div>
    </div>
  )
}
