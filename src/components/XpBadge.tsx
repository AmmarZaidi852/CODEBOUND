import { useState } from 'react'
import { levelForXp, levelProgress, XP_PER_LEVEL } from '../game/xp.ts'
import PixelProgress from './PixelProgress.tsx'
import './XpBadge.css'

interface XpBadgeProps {
  xp: number
  /** Large variant for the title screen. */
  large?: boolean
}

interface Gain {
  id: number
  text: string
}

/** Level, segmented XP bar, and total. Briefly pops "+100" when XP rises. */
function XpBadge({ xp, large = false }: XpBadgeProps) {
  const level = levelForXp(xp)
  const [shownXp, setShownXp] = useState(xp)
  const [gain, setGain] = useState<Gain | null>(null)

  // Adjust state while rendering when the prop changes (no effect needed).
  if (xp !== shownXp) {
    const levelUp = level > levelForXp(shownXp)
    setGain(
      xp > shownXp
        ? {
            id: (gain?.id ?? 0) + 1,
            text: `+${xp - shownXp}${levelUp ? ' · LEVEL UP' : ''}`,
          }
        : null,
    )
    setShownXp(xp)
  }

  const toNext = XP_PER_LEVEL - (xp % XP_PER_LEVEL)

  return (
    <div
      className={`xp-badge${large ? ' xp-badge--large' : ''}`}
      title={`${toNext} XP to level ${level + 1}`}
    >
      <span className="xp-badge__level">LV {level}</span>
      <PixelProgress
        className="xp-badge__bar"
        value={Math.floor(levelProgress(xp) * 10)}
        total={10}
      />
      <span className="xp-badge__xp">{xp} XP</span>
      {gain && (
        // Text lives in a data attribute: decorative, not read twice.
        <span
          key={gain.id}
          className="xp-badge__gain"
          data-text={gain.text}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default XpBadge
