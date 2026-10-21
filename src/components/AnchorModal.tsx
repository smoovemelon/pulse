import { useState } from 'react'
import { CloseButton, Modal } from './Modal'
import { usePulse } from '../pulse/context'

export function AnchorModal({ onClose }: { onClose: () => void }) {
  const { state, saveAnchor } = usePulse()
  const [value, setValue] = useState(state.disciplineAnchor)

  return (
    <Modal align="center" labelledBy="anchor-heading">
      <div className="w-full max-w-[360px] bg-card text-ink rounded-[32px] p-6 border border-line shadow-2xl flex flex-col gap-4 animate-slide-up">
        <div className="flex justify-between items-center">
          <h3 id="anchor-heading" className="text-base font-black">Edit Discipline Anchor</h3>
          <CloseButton onClick={onClose} />
        </div>
        <input
          data-testid="anchor-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="field w-full rounded-2xl p-3.5 text-xs focus:outline-none font-bold"
        />
        <button
          type="button"
          onClick={() => {
            if (saveAnchor(value)) onClose()
          }}
          className="w-full py-3 rounded-2xl depth-button-dark text-xs font-black shadow-md active:scale-95"
        >
          Save Anchor
        </button>
      </div>
    </Modal>
  )
}
