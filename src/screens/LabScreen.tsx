import { useMemo, useState } from 'react'
import type { ConceptId } from '../challenges/foundations.ts'
import { moduleTitle } from '../challenges/interaction.ts'
import { tierLabels } from '../challenges/meta.ts'
import PixelProgress from '../components/PixelProgress.tsx'
import PixelSprite from '../components/PixelSprite.tsx'
import TopBar from '../components/TopBar.tsx'
import { ARCADE_FINAL } from '../content/arcade.ts'
import { foundations } from '../content/foundations.ts'
import { games } from '../content/games.ts'
import {
  allCleared,
  allMastered,
  clearedCounts,
  conceptStatus,
  conceptTargets,
  labQueue,
  needsPracticeCount,
  priorityLabels,
  type ConceptLabel,
  type LabPriority,
  type LabTarget,
} from '../progression/lab.ts'
import type { ChallengeSource } from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import './LabScreen.css'

type Ref = { source: ChallengeSource; id: string }

interface LabScreenProps {
  onBack: () => void
  onPractice: (target: Ref, priority: LabPriority) => void
  onArcade: () => void
  onFoundations: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')

const conceptWords: Record<ConceptLabel, string> = {
  mastered: 'Mastered',
  recovered: 'Recovered',
  practice: 'Practice',
  new: 'Not started',
}

/** "Bug Hunt · Advanced", "Arcade · Final Run". */
function whereFrom(t: LabTarget) {
  if (t.source === 'arcade') {
    return t.index === ARCADE_FINAL ? 'Arcade · Final Run' : 'Arcade'
  }
  const game = games.find((g) => g.id === t.source)!
  return `${game.name} · ${tierLabels[t.tier]}`
}

const conceptNames = (t: LabTarget) =>
  foundations
    .filter((c) => t.module.concepts.includes(c.id))
    .map((c) => c.title)
    .join(' · ')

function TargetList({
  targets,
  onPractice,
}: {
  targets: LabTarget[]
  onPractice: LabScreenProps['onPractice']
}) {
  return (
    <ol className="lab__targets">
      {targets.map((t, i) => {
        const title = moduleTitle(t.module)
        return (
          <li key={`${t.source}:${t.id}`} className="lab-target">
            <span className="lab-target__rank" aria-hidden="true">
              {pad(i + 1)}
            </span>
            <div className="lab-target__info">
              <p className="lab-target__title">{title}</p>
              <p className="lab-target__from">{whereFrom(t)}</p>
              <p className="lab-target__meta">
                <span
                  className={`lab-target__reason lab-target__reason--${t.priority}`}
                >
                  {priorityLabels[t.priority]}
                </span>
                <span className="lab-target__concepts">{conceptNames(t)}</span>
              </p>
            </div>
            <button
              type="button"
              className="btn btn--go lab-target__go"
              aria-label={`Practice ${title}`}
              onClick={() => onPractice(t, t.priority)}
            >
              Practice
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** The Mastery Lab: what to practise next, worked out from saved progress. */
function LabScreen({
  onBack,
  onPractice,
  onArcade,
  onFoundations,
}: LabScreenProps) {
  const { progress } = useProgress()
  const [open, setOpen] = useState<ConceptId | null>(null)
  // Cheap, but derived once per progress change rather than per render.
  const lab = useMemo(
    () => ({
      queue: labQueue(progress),
      concepts: conceptStatus(progress),
      needs: needsPracticeCount(progress),
      // Practice is done once everything is cleared; first-try mastery of
      // everything is a separate, rarer claim.
      done: allCleared(progress),
      firstTry: allMastered(progress),
      counts: clearedCounts(progress),
    }),
    [progress],
  )
  const opened = lab.concepts.find((c) => c.id === open)
  const openedTargets = opened ? conceptTargets(progress, opened.id) : []

  return (
    <div className="screen" data-theme="lab">
      <TopBar backLabel="Home" onBack={onBack} />
      <main className="lab">
        <header className="lab__header panel">
          <div className="lab__art" aria-hidden="true">
            <PixelSprite id="lab" />
          </div>
          <div>
            <p className="eyebrow">Mastery // Training</p>
            <h1 className="lab__title">Mastery Lab</h1>
            <p className="lab__summary">
              {lab.firstTry
                ? 'All current modules mastered.'
                : lab.done
                  ? 'All current modules cleared.'
                  : lab.needs > 0
                    ? `${lab.needs} ${lab.needs === 1 ? 'module needs' : 'modules need'} practice.`
                    : 'Nothing missed so far. New challenges are waiting.'}
            </p>
          </div>
        </header>

        {lab.done ? (
          <section
            className="lab__complete panel"
            aria-labelledby="lab-complete"
          >
            <h2 id="lab-complete" className="lab__section-title">
              {lab.firstTry
                ? 'All current modules mastered'
                : 'All current modules cleared'}
            </h2>
            <p>
              {lab.firstTry
                ? 'Every module available right now is mastered on the first try.'
                : 'Every module available right now is mastered or recovered through practice.'}{' '}
              Replay the Arcade or review the lessons any time.
            </p>
            <dl className="lab__complete-counts">
              <div>
                <dt>First-try mastered</dt>
                <dd>{lab.counts.mastered}</dd>
              </div>
              <div>
                <dt>Recovered</dt>
                <dd>{lab.counts.recovered}</dd>
              </div>
            </dl>
            <div className="lab__complete-actions">
              <button
                type="button"
                className="btn btn--primary btn--go"
                onClick={onArcade}
              >
                Replay Arcade
              </button>
              <button type="button" className="btn" onClick={onFoundations}>
                Review Foundations
              </button>
              <button type="button" className="btn btn--ghost" onClick={onBack}>
                Back to Home
              </button>
            </div>
          </section>
        ) : (
          <section aria-labelledby="lab-targets">
            <h2 id="lab-targets" className="lab__section-title">
              Your next targets
            </h2>
            <TargetList targets={lab.queue} onPractice={onPractice} />
          </section>
        )}

        <section aria-labelledby="lab-concepts">
          <h2 id="lab-concepts" className="lab__section-title">
            Concept status
          </h2>
          <ul className="lab__concepts">
            {lab.concepts.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`lab-concept lab-concept--${c.label}`}
                  aria-expanded={open === c.id}
                  aria-controls="lab-concept-detail"
                  onClick={() => setOpen(open === c.id ? null : c.id)}
                >
                  <span className="lab-concept__name">{c.title}</span>
                  <PixelProgress
                    className="lab-concept__bar"
                    value={c.mastered + c.recovered}
                    total={c.total}
                    segments={c.states}
                    label={`${c.title} modules cleared`}
                    valueText={`${c.mastered} mastered and ${c.recovered} recovered of ${c.total} modules`}
                  />
                  <span className="lab-concept__count">
                    {c.mastered + c.recovered}/{c.total}
                  </span>
                  <span className="lab-concept__label">
                    {conceptWords[c.label]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {opened && (
            <div
              id="lab-concept-detail"
              className="lab__concept-detail panel"
              aria-live="polite"
            >
              <h3 className="lab__concept-title">{opened.title}</h3>
              <p className="lab__concept-counts">
                {opened.mastered} / {opened.total} mastered · {opened.recovered}{' '}
                recovered · {opened.total - opened.mastered - opened.recovered}{' '}
                to clear
              </p>
              <p>
                {opened.label === 'mastered' || opened.label === 'recovered'
                  ? `Every ${opened.title.toLowerCase()} module is cleared.`
                  : opened.learned
                    ? `You have completed the ${opened.title} lesson; the modules below still need clearing.`
                    : `The ${opened.title} lesson is in Python Foundations; these modules use the same idea.`}
              </p>
              {openedTargets.length > 0 ? (
                <>
                  <p className="lab__concept-recommended">Recommended</p>
                  <TargetList targets={openedTargets} onPractice={onPractice} />
                  <button
                    type="button"
                    className="btn btn--primary btn--go lab__concept-go"
                    onClick={() =>
                      onPractice(openedTargets[0], openedTargets[0].priority)
                    }
                  >
                    Practice {opened.title}
                  </button>
                </>
              ) : (
                opened.label !== 'mastered' &&
                opened.label !== 'recovered' && (
                  <p>
                    More {opened.title.toLowerCase()} modules unlock as you
                    progress.
                  </p>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default LabScreen
