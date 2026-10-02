import type { ConceptId } from '../challenges/foundations.ts'
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

function FoundationsScreen({
  xp,
  completed,
  onBack,
  onOpen,
}: FoundationsScreenProps) {
  const { done, total } = foundationsProgress(foundations, completed)
  const current = currentConcept(foundations, completed)

  return (
    <div className="screen">
      <TopBar xp={xp} backLabel="Home" onBack={onBack} />
      <main className="foundations">
        <p className="eyebrow">Learning path</p>
        <h1 className="foundations__title">Python Foundations</h1>
        <div className="foundations__progress">
          <p>
            {done} / {total} concepts completed
          </p>
          <div
            className="foundations__bar"
            role="progressbar"
            aria-label="Python Foundations progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <span style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>

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
                  {isDone ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <div className="concept-row__body">
                  <h2>{concept.title}</h2>
                  <p>
                    {isDone ? 'Completed' : isCurrent ? 'Up next' : 'Locked'}
                    {game && ` · Practise in ${game.name}`}
                  </p>
                </div>
                <button
                  type="button"
                  className={isCurrent ? 'btn btn--primary' : 'btn'}
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
