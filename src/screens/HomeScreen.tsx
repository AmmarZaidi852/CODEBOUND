import PixelProgress from '../components/PixelProgress.tsx'
import PixelSprite from '../components/PixelSprite.tsx'
import XpBadge from '../components/XpBadge.tsx'
import './HomeScreen.css'

interface HomeScreenProps {
  xp: number
  /** Python Foundations concepts completed / total. */
  learned: { done: number; total: number }
  onLearn: () => void
  onPlay: () => void
}

/** Title screen: logo, hero terminal, the two ways in, and player stats. */
function HomeScreen({ xp, learned, onLearn, onPlay }: HomeScreenProps) {
  const learnLabel =
    learned.done === 0
      ? 'START LEARNING'
      : learned.done < learned.total
        ? 'CONTINUE LEARNING'
        : 'REVIEW FOUNDATIONS'

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
        </div>

        <div className="home__player">
          <span className="home__player-label">Player</span>
          <XpBadge xp={xp} large />
        </div>
      </main>
    </div>
  )
}

export default HomeScreen
