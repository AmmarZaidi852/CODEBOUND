import { useState } from 'react'
import { moduleTitle } from '../challenges/interaction.ts'
import PixelSprite from '../components/PixelSprite.tsx'
import TopBar from '../components/TopBar.tsx'
import { ARCADE_FINAL } from '../content/arcade.ts'
import { useLabPractice } from '../game/useLabPractice.ts'
import {
  findLabModule,
  homeStates,
  labQueue,
  priorityLabels,
  type LabPriority,
} from '../progression/lab.ts'
import { challengeKey, type ChallengeSource } from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import { arcadeCodeTheme, codeThemes } from './codeThemes.ts'
import ModuleRound from './ModuleRound.tsx'
import './LabScreen.css'

type Ref = { source: ChallengeSource; id: string }

interface LabPracticeScreenProps {
  target: Ref
  /** Why the Lab recommended it, shown above the module. */
  priority: LabPriority
  onLab: () => void
  onNext: (target: Ref, priority: LabPriority) => void
}

const savedWords = {
  mastered: 'Mastered',
  completed: 'Completed, not cleared',
  recovered: 'Recovered',
  unplayed: 'Not solved yet',
}

/**
 * Practises one module from the Mastery Lab. The module is shown and
 * recorded exactly as in its own game (same round, HUD and progress).
 */
function LabPracticeScreen({
  target,
  priority,
  onLab,
  onNext,
}: LabPracticeScreenProps) {
  const { progress } = useProgress()
  const practice = useLabPractice(target)
  // Where the module lives, fixed for this practice.
  const [lab] = useState(() => findLabModule(progress, target))

  if (!lab) {
    return (
      <div className="screen" data-theme="lab">
        <TopBar backLabel="Lab" onBack={onLab} />
        <main className="lab">
          <p>That module is not available.</p>
        </main>
      </div>
    )
  }

  const tone = lab.source === 'arcade' ? 'arcade' : lab.source

  if (practice.finished) {
    const now = findLabModule(progress, target)?.state ?? 'unplayed'
    const paid =
      progress.challenges[challengeKey(target.source, target.id)]?.xp ?? 0
    // A challenge pays 100 XP at most, in total, wherever it is played.
    const left = Math.max(0, 100 - paid)
    const next = labQueue(progress, 6).find(
      (t) => !(t.source === target.source && t.id === target.id),
    )
    const solved = practice.result?.correct === true
    return (
      <div className="screen" data-theme="lab">
        <TopBar backLabel="Lab" onBack={onLab} />
        <main className="lab-result">
          <div className="lab-result__art" aria-hidden="true">
            <PixelSprite id="lab" />
          </div>
          <p className="lab-result__stamp">Mastery Lab · Practice</p>
          <h1 className="lab-result__title">
            {solved ? 'Target cleared' : 'Not solved yet'}
          </h1>
          <dl className="lab-result__stats">
            <div>
              <dt>Module</dt>
              <dd>{moduleTitle(lab.module)}</dd>
            </div>
            <div>
              <dt>Saved</dt>
              <dd>{savedWords[now]}</dd>
            </div>
            <div>
              <dt>XP</dt>
              <dd>{practice.xp > 0 ? `+${practice.xp}` : '+0'}</dd>
            </div>
          </dl>
          <p className="lab-result__note">
            {left > 0
              ? `Solving it later pays the remaining +${left} XP.`
              : now === 'recovered' && practice.result?.recovered
                ? 'You missed this module before and cleared it through practice. It leaves your targets.'
                : now === 'completed'
                  ? 'Solved with a hint. Clear it once without one to recover it.'
                  : practice.xp > 0
                    ? 'Practice pays the same XP as the game, once per module.'
                    : 'This module has already paid its XP. Replays are practice only.'}
          </p>
          {next && (
            <p className="lab-result__next">
              Next target: <strong>{moduleTitle(next.module)}</strong> ·{' '}
              {priorityLabels[next.priority]}
            </p>
          )}
          <div className="lab-result__actions">
            {next && (
              <button
                type="button"
                className="btn btn--primary btn--large btn--go"
                onClick={() => onNext(next, next.priority)}
              >
                Next practice
              </button>
            )}
            <button
              type="button"
              className={`btn btn--large${next ? '' : ' btn--primary'}`}
              onClick={onLab}
            >
              Back to Lab
            </button>
          </div>
        </main>
      </div>
    )
  }

  const states = homeStates(progress, lab.source)
  const theme =
    lab.source === 'arcade'
      ? arcadeCodeTheme(lab.index, lab.index === ARCADE_FINAL)
      : codeThemes[lab.source](lab.index)

  return (
    <div className="screen" data-theme={tone}>
      <TopBar backLabel="Lab" onBack={onLab} />
      <main className="game">
        <p className="lab-practice__strip" data-theme="lab">
          <span aria-hidden="true" />
          Mastery Lab · {priorityLabels[priority]}
        </p>
        <ModuleRound
          key={`${lab.source}:${lab.id}`}
          module={lab.module}
          theme={theme}
          index={lab.index}
          total={states.length}
          states={states}
          result={practice.result}
          isLast
          onSubmit={practice.submit}
          onRetry={practice.retry}
          onNext={practice.next}
          titleRef={practice.titleRef}
          feedbackRef={practice.feedbackRef}
        />
      </main>
    </div>
  )
}

export default LabPracticeScreen
