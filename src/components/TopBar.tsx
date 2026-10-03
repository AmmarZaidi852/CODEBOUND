import { useProgress } from '../progression/ProgressContext.ts'
import XpBadge from './XpBadge.tsx'
import './TopBar.css'

interface TopBarProps {
  backLabel?: string
  onBack?: () => void
}

function TopBar({ backLabel, onBack }: TopBarProps) {
  const { xp } = useProgress().progress
  return (
    <header className="top-bar">
      {onBack ? (
        <button
          type="button"
          className="btn btn--ghost top-bar__back"
          onClick={onBack}
        >
          ← {backLabel}
        </button>
      ) : (
        <span />
      )}
      <XpBadge xp={xp} />
    </header>
  )
}

export default TopBar
