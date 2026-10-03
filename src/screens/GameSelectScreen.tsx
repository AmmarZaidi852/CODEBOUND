import PixelProgress from '../components/PixelProgress.tsx'
import PixelSprite from '../components/PixelSprite.tsx'
import TopBar from '../components/TopBar.tsx'
import { foundations } from '../content/foundations.ts'
import {
  gameChallengeIds,
  gameModuleTiers,
  writeModuleCounts,
} from '../content/gameChallenges.ts'
import { games, type GameId } from '../content/games.ts'
import type { RunStart } from '../game/useChallengeRun.ts'
import {
  bossState,
  gameStates,
  gameStatus,
  statusLabels,
  tierCounts,
  type BossState,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import './GameSelectScreen.css'

interface GameSelectScreenProps {
  onBack: () => void
  onSelect: (id: GameId, startAt: RunStart) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

const bossLabels: Record<BossState, string> = {
  locked: 'Locked',
  ready: 'Ready',
  cleared: 'Cleared',
  mastered: 'Mastered',
}

/** Cartridge shelf: one card per game, each showing its saved progress. */
function GameSelectScreen({ onBack, onSelect }: GameSelectScreenProps) {
  const { progress } = useProgress()

  return (
    <div className="screen">
      <TopBar backLabel="Home" onBack={onBack} />
      <main className="game-select">
        <p className="eyebrow">Select cartridge</p>
        <h1 className="game-select__title">Choose your game</h1>
        <ul className="game-select__grid">
          {games.map((game, i) => {
            const states = gameStates(
              progress,
              game.id,
              gameChallengeIds[game.id],
            )
            const status = gameStatus(states)
            const done = states.filter((s) => s !== 'unplayed').length
            const tiers = gameModuleTiers[game.id]
            const core = tierCounts(states, tiers, 'core')
            const advanced = tierCounts(states, tiers, 'advanced')
            const boss = bossState(states, tiers)
            const cleared = status === 'complete' || status === 'mastered'
            return (
              <li
                key={game.id}
                data-theme={game.id}
                className={`game-card game-card--${status}${game.playable ? '' : ' game-card--locked'}`}
              >
                <div className="game-card__screen">
                  <span className="game-card__slot">Cart {pad(i + 1)}</span>
                  <PixelSprite id={game.id} className="game-card__art" />
                  <span
                    className={`game-card__status${cleared ? ' game-card__status--cleared' : ''}`}
                  >
                    <span aria-hidden="true" />
                    {cleared ? game.clearedStatus : game.status}
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
                  {writeModuleCounts[game.id] > 0 && (
                    <p className="game-card__write">
                      <span className="game-card__write-tag">Write</span>
                      {writeModuleCounts[game.id]} modules where you type the
                      code
                    </p>
                  )}
                  <div className="game-card__progress">
                    <span className="game-card__state">
                      <span aria-hidden="true" />
                      {statusLabels[status]}
                    </span>
                    <span className="game-card__count">
                      Modules {pad(done)} / {pad(states.length)}
                    </span>
                    <PixelProgress
                      className="game-card__bar"
                      value={done}
                      total={states.length}
                      segments={states}
                      label={`${game.name} modules complete`}
                      valueText={`${done} of ${states.length} modules complete`}
                    />
                    {boss && (
                      <p className="game-card__tiers">
                        <span
                          className={
                            core.done === core.total
                              ? 'game-card__tier--done'
                              : ''
                          }
                        >
                          Core {pad(core.done)}/{pad(core.total)}
                        </span>
                        <span
                          className={
                            advanced.done === advanced.total
                              ? 'game-card__tier--done'
                              : ''
                          }
                        >
                          Advanced {pad(advanced.done)}/{pad(advanced.total)}
                        </span>
                        <span
                          className={`game-card__boss game-card__boss--${boss}`}
                        >
                          Boss {bossLabels[boss]}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="game-card__actions">
                    {status === 'new' && (
                      <button
                        type="button"
                        className="btn btn--primary btn--go"
                        disabled={!game.playable}
                        aria-label={
                          game.playable
                            ? `Play ${game.name}`
                            : `${game.name} is locked`
                        }
                        onClick={() => onSelect(game.id, 'start')}
                      >
                        {game.playable ? 'Play' : 'Locked'}
                      </button>
                    )}
                    {status === 'in-progress' && (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--go"
                          aria-label={`Continue ${game.name}`}
                          onClick={() => onSelect(game.id, 'continue')}
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          className="btn game-card__replay"
                          aria-label={`Replay ${game.name} from the start`}
                          onClick={() => onSelect(game.id, 'start')}
                        >
                          Replay
                        </button>
                      </>
                    )}
                    {(status === 'complete' || status === 'mastered') && (
                      <button
                        type="button"
                        className="btn btn--primary btn--go"
                        aria-label={`Replay ${game.name}`}
                        onClick={() => onSelect(game.id, 'start')}
                      >
                        Replay
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}

export default GameSelectScreen
