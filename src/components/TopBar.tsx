import XpBadge from './XpBadge.tsx'
import './TopBar.css'

interface TopBarProps {
  xp: number
  backLabel?: string
  onBack?: () => void
}

function TopBar({ xp, backLabel, onBack }: TopBarProps) {
  return (
    <header className="top-bar">
      {onBack ? (
        <button type="button" className="btn btn--ghost" onClick={onBack}>
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
