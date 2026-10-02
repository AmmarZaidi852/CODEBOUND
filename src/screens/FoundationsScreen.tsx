import type { ConceptId } from '../challenges/foundations.ts'
import PixelProgress from '../components/PixelProgress.tsx'
import PixelSprite from '../components/PixelSprite.tsx'
import TopBar from '../components/TopBar.tsx'
import { foundations } from '../content/foundations.ts'
import { games } from '../content/games.ts'
import {
  currentConcept,
  foundationsProgress,
  isConceptUnlocked,
} from '../game/foundationsProgress.ts'
import './FoundationsScreen.css'

interface FoundationsScreenProps {
  xp: number
  completed: readonly ConceptId[]
  onBack: () => void
  onOpen: (id: ConceptId) => void
}

const stateLabels = {
  done: 'Complete',
  current: 'Current',
  locked: 'Locked',
}

/** The training campaign: eight concepts, done → current → locked. */
function FoundationsScreen({
  xp,
  completed,
  onBack,
  onOpen,
}: FoundationsScreenProps) {
  const { done, total } = foundationsProgress(foundations, completed)
  const current = currentConcept(foundations, completed)

  return (
    <div className="screen" data-theme="foundations">
      <TopBar xp={xp} backLabel="Home" onBack={onBack} />
      <main className="foundations">
        <header className="foundations__header panel">
          <div className="foundations__art">
            <PixelSprite id="foundations" />
          </div>
          <div className="foundations__intro">
            <p className="eyebrow">Training campaign</p>
            <h1 className="foundations__title">Python Foundations</h1>
            <div className="foundations__progress">
              <p>
                {done} / {total} concepts completed
              </p>
              <PixelProgress
                className="foundations__bar"
                value={done}
                total={total}
                label="Python Foundations progress"
                valueText={`${done} of ${total} concepts completed`}
              />
            </div>
          </div>
        </header>

        <ol className="concept-path">
          {foundations.map((concept, i) => {
            const isDone = completed.includes(concept.id)
            const unlocked = isConceptUnlocked(
              foundations,
              completed,
              concept.id,
            )
            const isCurrent = current?.id === concept.id
            const state = isDone ? 'done' : isCurrent ? 'current' : 'locked'
            const game = games.find((g) => g.id === concept.game)
            return (
              <li key={concept.id} className={`concept-row ${state}`}>
                <span className="concept-row__number" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="concept-row__body">
                  <h2>{concept.title}</h2>
                  <p>
                    <span className="concept-row__state">
                      <span className="concept-row__icon" aria-hidden="true" />
                      {stateLabels[state]}
                    </span>
                    {game && (
                      <span className="concept-row__game">
                        Practise in {game.name}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className={`btn ${isCurrent ? 'btn--primary btn--go' : ''}`}
                  disabled={!unlocked}
                  aria-label={
                    unlocked
                      ? `${isDone ? 'Review' : 'Start'} ${concept.title}`
                      : `${concept.title} is locked`
                  }
                  onClick={() => onOpen(concept.id)}
                >
                  {isDone ? 'Review' : unlocked ? 'Start' : 'Locked'}
                </button>
              </li>
            )
          })}
        </ol>

        {!current && (
          <p className="foundations__done">
            All foundations complete. Keep practising in the games.
          </p>
        )}
      </main>
    </div>
  )
}

export default FoundationsScreen
