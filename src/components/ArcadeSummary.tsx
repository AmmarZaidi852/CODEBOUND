import { arcadeModules } from '../content/arcade.ts'
import { foundations } from '../content/foundations.ts'
import { accuracyOf, bestOf, isBetterRun } from '../progression/arcade.ts'
import {
  challengeKey,
  challengeState,
  type ArcadeBest,
  type ArcadeRun,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import PixelSprite from './PixelSprite.tsx'
import './RunSummary.css'
import './ArcadeSummary.css'

interface ArcadeSummaryProps {
  /** The finished run's counts. */
  run: ArcadeRun
  /** The best run before this one, to tell whether it was beaten. */
  bestBefore: ArcadeBest | null
  onExit: () => void
  onReplay: () => void
}

/** Arcade completion: how this run went, the best run, and what it covered. */
function ArcadeSummary({
  run,
  bestBefore,
  onExit,
  onReplay,
}: ArcadeSummaryProps) {
  const { progress } = useProgress()
  const total = arcadeModules.length
  const best = progress.arcade.best
  // A first run is the best by default; only beating an earlier one counts.
  const newBest = bestBefore !== null && isBetterRun(bestOf(run), bestBefore)
  const accuracy = accuracyOf(run)
  const mastered = arcadeModules.filter(
    (m) =>
      challengeState(progress.challenges[challengeKey(m.source, m.id)]) ===
      'mastered',
  ).length
  const used = new Set(arcadeModules.flatMap((m) => m.module.concepts))
  const concepts = foundations.filter((c) => used.has(c.id))

  return (
    <main className="run-summary arcade-summary">
      <div className="run-summary__art" aria-hidden="true">
        <span className="run-summary__burst" />
        <PixelSprite id="arcade" />
      </div>
      <p className="run-summary__stamp">
        Arcade · {newBest ? 'New best run' : 'Run complete'}
      </p>
      <h1 className="run-summary__title">Run complete</h1>
      <p>
        You finished all {total} mixed modules and solved {run.correct} of them.
      </p>
      <dl className="run-summary__stats">
        <div className="run-summary__stat--xp">
          <dt>XP earned</dt>
          <dd>+{run.xp}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>
            {run.correct}/{total}
          </dd>
        </div>
        <div>
          <dt>First try</dt>
          <dd>
            {run.firstTry}/{total}
          </dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{accuracy}%</dd>
        </div>
      </dl>
      <p className="arcade-summary__detail">
        {run.correctChecks} of {run.checks} checks correct · {mastered} of{' '}
        {total} modules mastered in your saved progress
      </p>
      {best && (
        <section className="arcade-summary__best" aria-label="Best run">
          <p className="arcade-summary__best-label">
            Best run
            {newBest && <span className="arcade-summary__new">New best</span>}
          </p>
          <p className="arcade-summary__best-stats">
            {best.correct}/{total} correct · {best.firstTry} first try ·{' '}
            {best.accuracy}% accuracy
          </p>
        </section>
      )}
      <p className="arcade-summary__concepts">
        <span className="arcade-summary__concepts-label">Concepts</span>{' '}
        {concepts.map((c) => c.title).join(' · ')}
      </p>
      <p className="run-summary__next">
        {run.xp === 0
          ? 'Replay run: XP for these challenges was already earned, so this run is for practice and your best run.'
          : 'Each challenge pays its normal XP once. Replay any time to beat your best run.'}
      </p>
      <div className="run-summary__actions">
        <button
          type="button"
          className="btn btn--primary btn--large btn--go"
          onClick={onExit}
        >
          Back to games
        </button>
        <button type="button" className="btn btn--large" onClick={onReplay}>
          Replay run
        </button>
      </div>
    </main>
  )
}

export default ArcadeSummary
