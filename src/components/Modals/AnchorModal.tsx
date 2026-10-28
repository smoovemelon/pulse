import { useState } from 'react'
import { DEFAULT_ANCHOR } from '../../lib/dates'
import { useSettings } from '../../hooks/useSettings'
import { DEMO_ANCHOR } from '../../services/demo'
import { Button } from '../Common/Button'
import { CloseButton, Modal } from '../Common/ModalSheet'

export function AnchorModal({ onClose }: { readonly onClose: () => void }) {
  const { anchor, demoMode, saveAnchor } = useSettings()
  const [value, setValue] = useState(anchor === DEFAULT_ANCHOR ? (demoMode ? DEMO_ANCHOR : '') : anchor)

  return (
    <Modal align="center" labelledBy="anchor-heading" onDismiss={onClose}>
      <div className="w-full max-w-[360px] bg-card text-ink rounded-[32px] p-6 border border-line shadow-2xl flex flex-col gap-4 animate-slide-up">
        <div className="flex justify-between items-center">
          <div>
            <span className="eyebrow block mb-0.5">Discipline Anchor</span>
            <h3 id="anchor-heading" className="text-base heading-athletic text-ink">Edit Anchor</h3>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="anchor-input" className="eyebrow eyebrow-muted">
            Your goal
          </label>
          <input
            id="anchor-input"
            data-testid="anchor-input"
            value={value}
            placeholder={DEFAULT_ANCHOR}
            onChange={(event) => setValue(event.target.value)}
            className="field w-full rounded-2xl p-3.5 text-xs font-bold"
          />
        </div>
        <Button
          tone="dark"
          onClick={() => {
            if (saveAnchor(value)) onClose()
          }}
          className="action-btn"
        >
          Save Anchor
        </Button>
      </div>
    </Modal>
  )
}
