import PixelProgress from '../components/PixelProgress.tsx'
import PixelSprite from '../components/PixelSprite.tsx'
import ResetProgress from '../components/ResetProgress.tsx'
import XpBadge from '../components/XpBadge.tsx'
import { arcadeModules } from '../content/arcade.ts'
import { arcadeStatus } from '../progression/arcade.ts'
import {
  allCleared,
  allMastered,
  labAvailable,
  needsPracticeCount,
} from '../progression/lab.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import './HomeScreen.css'

interface HomeScreenProps {
  /** Python Foundations concepts completed / total. */
  learned: { done: number; total: number }
  onLearn: () => void
  onPlay: () => void
  onLab: () => void
}

/** Title screen: logo, hero terminal, the two ways in, and player stats. */
function HomeScreen({ learned, onLearn, onPlay, onLab }: HomeScreenProps) {
  const { progress } = useProgress()
  const { xp } = progress
  const arcade = arcadeStatus(progress)
  const run = progress.arcade.run
  const total = arcadeModules.length
  const lab = labAvailable(progress)
  const mastered = lab && allMastered(progress)
  const cleared = lab && allCleared(progress)
  const needs = lab ? needsPracticeCount(progress) : 0
  const learnLabel =
    learned.done === 0
      ? 'START LEARNING'
      : learned.done < learned.total
        ? 'CONTINUE LEARNING'
        : 'REVIEW LEARNING'

  return (
    <div className="screen" data-theme="foundations">
      <main className="home">
        <div className="home__hero">
          <div className="home__crt">
            <PixelSprite id="hero" />
          </div>
        </div>

        <div className="home__title">
          <p className="home__prompt">
            &gt; python.init()
            <span className="cursor" aria-hidden="true" />
          </p>
          <h1 className="home__logo">CODEBOUND</h1>
          <p className="home__tagline">Learn Python. Play the Code.</p>
        </div>

        <div className="home__menu">
          <button
            type="button"
            className="btn btn--primary btn--large btn--go home__start"
            onClick={onLearn}
          >
            {learnLabel}
          </button>
          <div className="home__path">
            <span>
              Python Foundations · {learned.done}/{learned.total} concepts
            </span>
            <PixelProgress
              className="home__path-bar"
              value={learned.done}
              total={learned.total}
            />
          </div>
          <button
            type="button"
            className="btn btn--large home__play"
            onClick={onPlay}
          >
            PLAY
          </button>
          <p className="home__hint">Jump into any of the four games</p>
          {arcade !== 'locked' && (
            <p className="home__arcade" data-theme="arcade">
              <span aria-hidden="true" />
              {run
                ? `Arcade run in progress · module ${run.at + 1} of ${total}`
                : `Arcade ready · ${total} module run`}
            </p>
          )}
        </div>

        {lab && (
          <section
            className="home__lab"
            data-theme="lab"
            aria-labelledby="home-lab-title"
          >
            <div>
              <h2 className="home__lab-title" id="home-lab-title">
                Mastery Lab
              </h2>
              <p className="home__lab-status">
                {mastered
                  ? 'All current modules mastered'
                  : cleared
                    ? 'All current modules cleared'
                    : needs > 0
                      ? `${needs} ${needs === 1 ? 'module needs' : 'modules need'} practice`
                      : 'Practise your next targets'}
              </p>
            </div>
            <button
              type="button"
              className="btn home__lab-open"
              onClick={onLab}
            >
              {cleared ? 'Review' : 'Open Lab'}
            </button>
          </section>
        )}

        <div className="home__player">
          <span className="home__player-label">Player</span>
          <XpBadge xp={xp} large />
        </div>

        <footer className="home__footer">
          <p>Progress is saved in this browser.</p>
          <ResetProgress />
        </footer>
      </main>
    </div>
  )
}

export default HomeScreen
