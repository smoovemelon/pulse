import { useState } from 'react'
import { Button } from '../Common/Button'
import { ModalSheet } from '../Common/ModalSheet'

export function IdentityModal({ onConfirm }: { readonly onConfirm: (username: string) => void }) {
  const [value, setValue] = useState('')
  const ready = value.trim().length > 0

  const confirm = () => {
    if (!ready) return
    onConfirm(value.trim())
  }

  return (
    <ModalSheet labelledBy="identity-heading">
      <div className="flex flex-col items-center text-center gap-2 pt-3">
        <span className="heading-athletic text-xl tracking-tighter text-ink">ALTIUS</span>
        <h3 id="identity-heading" className="mt-3 text-base heading-athletic text-ink">
          Welcome to Altius
        </h3>
        <p className="max-w-[28ch] text-[11px] leading-relaxed text-body">
          Enter your handle to initialize your discipline ledger and track daily momentum.
        </p>
      </div>
      <input
        id="identity-name"
        data-testid="identity-name"
        value={value}
        autoFocus
        placeholder="e.g. adrinn"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') confirm()
        }}
        className="field w-full rounded-2xl p-3.5 text-xs font-bold focus:outline-none"
        autoComplete="nickname"
      />
      <Button
        tone="dark"
        data-testid="identity-confirm"
        disabled={!ready}
        onClick={confirm}
        className="action-btn disabled:opacity-40"
      >
        Confirm
      </Button>
    </ModalSheet>
  )
}
