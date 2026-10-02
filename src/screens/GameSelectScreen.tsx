import TopBar from '../components/TopBar.tsx'
import { games, type GameId } from '../content/games.ts'
import './GameSelectScreen.css'

interface GameSelectScreenProps {
  xp: number
  onBack: () => void
  onSelect: (id: GameId) => void
}

function GameSelectScreen({ xp, onBack, onSelect }: GameSelectScreenProps) {
  return (
    <div className="screen">
      <TopBar xp={xp} backLabel="Home" onBack={onBack} />
      <main className="game-select">
        <p className="eyebrow">Select game</p>
        <h1 className="game-select__title">Choose your game</h1>
        <ul className="game-select__grid">
          {games.map((game) => (
            <li
              key={game.id}
              className={`game-card${game.playable ? '' : ' game-card--locked'}`}
            >
              <div className="game-card__meta">
                <span className="game-card__concept">{game.concept}</span>
                <span>{game.playable ? 'Playable' : 'Coming soon'}</span>
              </div>
              <h2 className="game-card__name">{game.name}</h2>
              <p className="game-card__description">{game.description}</p>
              <button
                type="button"
                className={game.playable ? 'btn btn--primary' : 'btn'}
                disabled={!game.playable}
                aria-label={
                  game.playable ? `Play ${game.name}` : `${game.name} is locked`
                }
                onClick={() => onSelect(game.id)}
              >
                {game.playable ? 'Play' : 'Locked'}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default GameSelectScreen
