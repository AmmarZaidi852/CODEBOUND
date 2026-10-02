import TopBar from '../components/TopBar.tsx'
import './HomeScreen.css'

interface HomeScreenProps {
  xp: number
  onPlay: () => void
}

function HomeScreen({ xp, onPlay }: HomeScreenProps) {
  return (
    <div className="screen">
      <TopBar xp={xp} />
      <main className="home">
        <p className="eyebrow home__prompt">&gt; python.init()</p>
        <h1 className="home__logo">CODEBOUND</h1>
        <p className="home__tagline">Learn Python. Play the Code.</p>
        <button
          type="button"
          className="btn btn--primary home__play"
          onClick={onPlay}
        >
          PLAY
        </button>
        <p className="home__hint">
          Short coding games · real Python concepts · instant feedback
        </p>
      </main>
    </div>
  )
}

export default HomeScreen
