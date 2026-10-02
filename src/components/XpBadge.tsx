import { levelForXp, levelProgress } from '../game/xp.ts'
import './XpBadge.css'

interface XpBadgeProps {
  xp: number
}

function XpBadge({ xp }: XpBadgeProps) {
  return (
    <div className="xp-badge">
      <span className="xp-badge__level">LV {levelForXp(xp)}</span>
      <span className="xp-badge__bar" aria-hidden="true">
        <span
          className="xp-badge__fill"
          style={{ width: `${levelProgress(xp) * 100}%` }}
        />
      </span>
      <span className="xp-badge__xp">{xp} XP</span>
    </div>
  )
}

export default XpBadge
