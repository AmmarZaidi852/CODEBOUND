import type { Tier } from '../challenges/meta.ts'
import './TierTag.css'

/** Small ADVANCED / BOSS MODULE tag after a mission label. CORE shows none. */
function TierTag({ tier }: { tier?: Tier }) {
  if (!tier || tier === 'core') return null
  return (
    <span className={`tier-tag tier-tag--${tier}`}>
      {tier === 'boss' ? 'Boss module' : 'Advanced'}
    </span>
  )
}

/** "System critical" strip at the top of a boss mission panel. */
export function BossStrip({ tier }: { tier?: Tier }) {
  if (tier !== 'boss') return null
  return (
    <p className="mission__boss-strip">
      <span aria-hidden="true" />
      System critical · Final test
    </p>
  )
}

export default TierTag
