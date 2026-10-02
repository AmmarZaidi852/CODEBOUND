import PixelSprite from '../components/PixelSprite.tsx'
import TopBar from '../components/TopBar.tsx'
import { foundations } from '../content/foundations.ts'
import { games, type GameId } from '../content/games.ts'
import './GameSelectScreen.css'

interface GameSelectScreenProps {
  xp: number
  onBack: () => void
  onSelect: (id: GameId) => void
}

/** Cartridge shelf: one card per game, each in its own area colour. */
function GameSelectScreen({ xp, onBack, onSelect }: GameSelectScreenProps) {
  return (
    <div className="screen">
      <TopBar xp={xp} backLabel="Home" onBack={onBack} />
      <main className="game-select">
        <p className="eyebrow">Select cartridge</p>
        <h1 className="game-select__title">Choose your game</h1>
        <ul className="game-select__grid">
          {games.map((game, i) => (
            <li
              key={game.id}
              data-theme={game.id}
              className={`game-card${game.playable ? '' : ' game-card--locked'}`}
            >
              <div className="game-card__screen">
                <span className="game-card__slot">
                  Cart {String(i + 1).padStart(2, '0')}
                </span>
                <PixelSprite id={game.id} className="game-card__art" />
                <span className="game-card__status">
                  <span aria-hidden="true" />
                  {game.status}
                </span>
              </div>
              <div className="game-card__label">
                <h2 className="game-card__name">{game.name}</h2>
                <p className="game-card__description">{game.description}</p>
                <p className="game-card__learn-row">
                  <span className="game-card__learn-tag">Learn</span>
                  <span className="game-card__learn">
                    {foundations
                      .filter((c) => c.game === game.id)
                      .map((c) => c.title)
                      .join(' · ')}
                  </span>
                </p>
                <button
                  type="button"
                  className={`btn btn--go ${game.playable ? 'btn--primary' : ''}`}
                  disabled={!game.playable}
                  aria-label={
                    game.playable
                      ? `Play ${game.name}`
                      : `${game.name} is locked`
                  }
                  onClick={() => onSelect(game.id)}
                >
                  {game.playable ? 'Play' : 'Locked'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default GameSelectScreen
