import type { SpriteId } from '../art/sprites.ts'
import { levelForXp, levelProgress, XP_PER_LEVEL } from '../game/xp.ts'
import PixelProgress from './PixelProgress.tsx'
import PixelSprite from './PixelSprite.tsx'
import './RunSummary.css'

interface RunSummaryProps {
  art: SpriteId
  gameName: string
  title: string
  message: string
  /** Session XP, for the level meter. */
  xp: number
  runXp: number
  total: number
  solved: number
  onExit: () => void
  exitLabel?: string
}

/** Completion screen body shown at the end of a game's challenge run. */
function RunSummary({
  art,
  gameName,
  title,
  message,
  xp,
  runXp,
  total,
  solved,
  onExit,
  exitLabel = 'Back to games',
}: RunSummaryProps) {
  const level = levelForXp(xp)
  return (
    <main className="run-summary">
      <div className="run-summary__art" aria-hidden="true">
        <span className="run-summary__burst" />
        <PixelSprite id={art} />
      </div>
      <p className="run-summary__stamp">{gameName} · Mission complete</p>
      <h1 className="run-summary__title">{title}</h1>
      <p>{message}</p>
      <dl className="run-summary__stats">
        <div className="run-summary__stat--xp">
          <dt>XP earned</dt>
          <dd>+{runXp}</dd>
        </div>
        <div>
          <dt>Challenges completed</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>Solved first try</dt>
          <dd>
            {solved}/{total}
          </dd>
        </div>
      </dl>
      <div className="run-summary__level">
        <span>Level {level}</span>
        <PixelProgress
          value={Math.floor(levelProgress(xp) * 10)}
          total={10}
          className="run-summary__level-bar"
        />
        <span>
          {XP_PER_LEVEL - (xp % XP_PER_LEVEL)} XP to level {level + 1}
        </span>
      </div>
      <button
        type="button"
        className="btn btn--primary btn--large btn--go"
        onClick={onExit}
      >
        {exitLabel}
      </button>
    </main>
  )
}

export default RunSummary
