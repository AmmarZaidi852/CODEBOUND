import { arcadeModules } from '../content/arcade.ts'
import { games } from '../content/games.ts'
import {
  arcadeStatus,
  coreGamesComplete,
  type ArcadeStatus,
} from '../progression/arcade.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import PixelProgress from './PixelProgress.tsx'
import PixelSprite from './PixelSprite.tsx'
import './ArcadeCard.css'

interface ArcadeCardProps {
  /** 'start' begins a new run at module 01; 'continue' resumes the saved one. */
  onPlay: (mode: 'start' | 'continue') => void
}

const statusWords: Record<ArcadeStatus, string> = {
  locked: 'Arcade locked',
  new: 'Arcade ready',
  'in-progress': 'In progress',
  complete: 'Complete',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The Arcade cartridge: a different kind of play, below the four games. */
function ArcadeCard({ onPlay }: ArcadeCardProps) {
  const { progress } = useProgress()
  const status = arcadeStatus(progress)
  const { run, best, runs } = progress.arcade
  const total = arcadeModules.length
  const cores = coreGamesComplete(progress)

  return (
    <section
      className={`game-card arcade-card arcade-card--${status}`}
      data-theme="arcade"
      aria-labelledby="arcade-card-name"
    >
      <div className="game-card__screen arcade-card__screen">
        <span className="game-card__slot">Bonus</span>
        <PixelSprite id="arcade" className="game-card__art" />
        <span className="game-card__status">
          <span aria-hidden="true" />
          {status === 'locked'
            ? 'Locked'
            : status === 'complete'
              ? 'Cleared'
              : 'Ready'}
        </span>
      </div>
      <div className="game-card__label">
        <h2 className="game-card__name" id="arcade-card-name">
          Codebound Arcade
        </h2>
        <p className="arcade-card__tagline">
          Mixed system run · {total} modules
        </p>
        <p className="game-card__description">
          Ideas from all four games in one short run. No new Python: work out
          what each problem needs.
        </p>
        <div className="game-card__progress">
          <span className="game-card__state arcade-card__state">
            <span aria-hidden="true" />
            {statusWords[status]}
          </span>
          {status === 'locked' && (
            <>
              <span className="game-card__count">
                Core {cores}/{games.length} games
              </span>
              <PixelProgress
                className="game-card__bar"
                value={cores}
                total={games.length}
                label="Games with every Core module complete"
                valueText={`${cores} of ${games.length} games`}
              />
              <p className="arcade-card__hint">
                Complete the Core modules in all four games.
              </p>
            </>
          )}
          {run && (
            <span className="game-card__count">
              Module {pad(run.at + 1)} / {pad(total)}
            </span>
          )}
          {status === 'complete' && (
            <span className="game-card__count">
              {runs} {runs === 1 ? 'run' : 'runs'} finished
            </span>
          )}
          {best && (
            <p className="arcade-card__best">
              Best {best.correct}/{total} · {best.firstTry} first try ·{' '}
              {best.accuracy}%
            </p>
          )}
        </div>
        {status !== 'locked' && (
          <div className="game-card__actions">
            {status === 'new' && (
              <button
                type="button"
                className="btn btn--primary btn--go"
                aria-label="Play Arcade Run"
                onClick={() => onPlay('start')}
              >
                Play
              </button>
            )}
            {status === 'in-progress' && (
              <>
                <button
                  type="button"
                  className="btn btn--primary btn--go"
                  onClick={() => onPlay('continue')}
                >
                  Continue Arcade
                </button>
                <button
                  type="button"
                  className="btn game-card__replay"
                  aria-label="Replay Arcade Run from the start"
                  onClick={() => onPlay('start')}
                >
                  Replay
                </button>
              </>
            )}
            {status === 'complete' && (
              <button
                type="button"
                className="btn btn--primary btn--go"
                onClick={() => onPlay('start')}
              >
                Replay Arcade
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default ArcadeCard
