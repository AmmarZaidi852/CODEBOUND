import TopBar from '../components/TopBar.tsx'
import './HomeScreen.css'

interface HomeScreenProps {
  xp: number
  /** Python Foundations concepts completed / total. */
  learned: { done: number; total: number }
  onLearn: () => void
  onPlay: () => void
}

function HomeScreen({ xp, learned, onLearn, onPlay }: HomeScreenProps) {
  const learnLabel =
    learned.done === 0
      ? 'START LEARNING'
      : learned.done < learned.total
        ? 'CONTINUE LEARNING'
        : 'REVIEW FOUNDATIONS'

  return (
    <div className="screen">
      <TopBar xp={xp} />
      <main className="home">
        <p className="eyebrow home__prompt">&gt; python.init()</p>
        <h1 className="home__logo">CODEBOUND</h1>
        <p className="home__tagline">Learn Python. Play the Code.</p>
        <div className="home__actions">
          <button
            type="button"
            className="btn btn--primary home__play"
            onClick={onLearn}
          >
            {learnLabel}
          </button>
          <button type="button" className="btn home__play" onClick={onPlay}>
            PLAY
          </button>
        </div>
        <p className="home__progress">
          Python Foundations · {learned.done}/{learned.total} concepts
        </p>
        <p className="home__hint">
          Short coding games · real Python concepts · instant feedback
        </p>
      </main>
    </div>
  )
}

export default HomeScreen
