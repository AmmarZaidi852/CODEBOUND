import type { GameId } from '../content/games.ts'
import type { RunStart, RunStats } from '../game/useChallengeRun.ts'
import { levelForXp, levelProgress, XP_PER_LEVEL } from '../game/xp.ts'
import {
  gameStates,
  gameStatus,
  statusLabels,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import PixelProgress from './PixelProgress.tsx'
import PixelSprite from './PixelSprite.tsx'
import './RunSummary.css'

interface RunSummaryProps {
  game: GameId
  gameName: string
  title: string
  message: string
  challengeIds: readonly string[]
  stats: RunStats
  onExit: () => void
  exitLabel?: string
  /** Plays the game again: "continue" retries unfinished modules. */
  onPlayAgain: (startAt: RunStart) => void
}

/** Completion screen: what this run achieved, and where the game stands. */
function RunSummary({
  game,
  gameName,
  title,
  message,
  challengeIds,
  stats,
  onExit,
  exitLabel = 'Back to games',
  onPlayAgain,
}: RunSummaryProps) {
  const { progress } = useProgress()
  const states = gameStates(progress, game, challengeIds)
  const status = gameStatus(states)
  const total = states.length
  const done = states.filter((s) => s !== 'unplayed').length
  const mastered = states.filter((s) => s === 'mastered').length
  const remaining = total - done
  const level = levelForXp(progress.xp)

  const stamp =
    status === 'mastered'
      ? 'Game mastered'
      : status === 'complete'
        ? 'Mission complete'
        : 'Run complete'

  return (
    <main className="run-summary">
      <div className="run-summary__art" aria-hidden="true">
        <span className="run-summary__burst" />
        <PixelSprite id={game} />
      </div>
      <p className="run-summary__stamp">
        {gameName} · {stats.replay ? 'Replay' : stamp}
      </p>
      <h1 className="run-summary__title">{title}</h1>
      <p>{message}</p>
      <dl className="run-summary__stats">
        <div className="run-summary__stat--xp">
          <dt>XP earned</dt>
          <dd>+{stats.runXp}</dd>
        </div>
        <div>
          <dt>Correct this run</dt>
          <dd>
            {stats.correct}/{stats.played}
          </dd>
        </div>
        <div>
          <dt>Modules complete</dt>
          <dd>
            {done}/{total}
          </dd>
        </div>
        <div>
          <dt>Mastered</dt>
          <dd>
            {mastered}/{total}
          </dd>
        </div>
      </dl>
      <div className="run-summary__progress">
        <span>Game status: {statusLabels[status]}</span>
        <PixelProgress
          value={done}
          total={total}
          segments={states}
          className="run-summary__level-bar"
        />
      </div>
      <p className="run-summary__next">
        {stats.replay && stats.runXp === 0
          ? 'Replay run: XP for these modules was already earned. '
          : ''}
        {remaining > 0
          ? `${remaining} module${remaining === 1 ? '' : 's'} left to complete.`
          : status === 'mastered'
            ? 'Every module mastered on the first try.'
            : `Every module complete · ${mastered} of ${total} mastered on the first try.`}
      </p>
      <div className="run-summary__level">
        <span>Level {level}</span>
        <PixelProgress
          value={Math.floor(levelProgress(progress.xp) * 10)}
          total={10}
          className="run-summary__level-bar"
        />
        <span>
          {XP_PER_LEVEL - (progress.xp % XP_PER_LEVEL)} XP to level {level + 1}
        </span>
      </div>
      <div className="run-summary__actions">
        <button
          type="button"
          className="btn btn--primary btn--large btn--go"
          onClick={onExit}
        >
          {exitLabel}
        </button>
        <button
          type="button"
          className="btn btn--large"
          onClick={() => onPlayAgain(remaining > 0 ? 'continue' : 'start')}
        >
          {remaining > 0 ? 'Retry unfinished' : `Replay ${gameName}`}
        </button>
      </div>
    </main>
  )
}

export default RunSummary
