import type { ReactNode } from 'react'
import './ActionBar.css'

interface ActionBarProps {
  /** What to do next, e.g. "Choose a patch". */
  hint: ReactNode
  label: string
  disabled: boolean
  onClick: () => void
}

/** The screen's one primary action, pinned to the bottom while scrolling. */
function ActionBar({ hint, label, disabled, onClick }: ActionBarProps) {
  return (
    <div className="action-bar">
      <p className="action-bar__hint">
        <span
          className={`action-bar__led${disabled ? '' : ' action-bar__led--ready'}`}
          aria-hidden="true"
        />
        {hint}
      </p>
      <button
        type="button"
        className="btn btn--primary btn--large btn--go"
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  )
}

export default ActionBar
