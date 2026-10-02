import {
  CODE_SLOT,
  getCorrectOption,
  hasCodeSlot,
  isCorrectOption,
  type CodeBreakerChallenge,
} from '../challenges/codeBreaker.ts'
import ActionBar from '../components/ActionBar.tsx'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import RunSummary from '../components/RunSummary.tsx'
import type { StatusState } from '../components/StatusBadge.tsx'
import TopBar from '../components/TopBar.tsx'
import { codeBreakerChallenges } from '../content/codeBreakerChallenges.ts'
import { useChallengeRun } from '../game/useChallengeRun.ts'
import './CodeBreakerScreen.css'

interface CodeBreakerScreenProps {
  xp: number
  onEarnXp: (amount: number) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  challenges?: CodeBreakerChallenge[]
}

type LockState = 'locked' | 'unlocked' | 'failed'

const lockLabels: Record<LockState, string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  failed: 'Still locked',
}

const lockStates: Record<LockState, StatusState> = {
  locked: 'idle',
  unlocked: 'ok',
  failed: 'fail',
}

function CodeBreakerScreen({
  xp,
  onEarnXp,
  onExit,
  exitLabel = 'Games',
  challenges = codeBreakerChallenges,
}: CodeBreakerScreenProps) {
  const {
    index,
    isLast,
    selectedId,
    result,
    runXp,
    solved,
    finished,
    titleRef,
    feedbackRef,
    select,
    submit,
    next,
  } = useChallengeRun(challenges.length, onEarnXp)

  if (finished) {
    return (
      <div className="screen" data-theme="code-breaker">
        <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          art="code-breaker"
          gameName="Code Breaker"
          title="All locks broken"
          message="Every security node is open. Your logic held up."
          xp={xp}
          runXp={runXp}
          total={challenges.length}
          solved={solved}
          onExit={onExit}
          exitLabel={`Back to ${exitLabel.toLowerCase()}`}
        />
      </div>
    )
  }

  const challenge = challenges[index]
  const correctOption = getCorrectOption(challenge)
  const selectedOption = challenge.options.find((o) => o.id === selectedId)
  const lockState: LockState = !result
    ? 'locked'
    : result.correct
      ? 'unlocked'
      : 'failed'
  // After submitting, the slot always shows the working logic.
  const slotValue = result ? correctOption.code : (selectedOption?.code ?? null)

  return (
    <div className="screen" data-theme="code-breaker">
      <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <GameHud
          art="code-breaker"
          name="Code Breaker"
          index={index}
          total={challenges.length}
          status={{
            label: 'Security',
            value: lockLabels[lockState],
            state: lockStates[lockState],
          }}
        />

        <section className={`mission panel access-panel--${lockState}`}>
          <p className="mission__id">
            Security {challenge.node} · Break the lock
          </p>
          <h1 className="game__title" ref={titleRef} tabIndex={-1}>
            {challenge.system}
          </h1>
          <p className="mission__objective">
            <span className="mission__label">Rule</span>
            {challenge.rule}
          </p>
          <dl className="access-panel__state" aria-label="System state">
            {challenge.state.map((item) => (
              <div key={item.name}>
                <dt>{item.name}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

        <CodeBlock
          fileName={`node_${String(index + 1).padStart(2, '0')}.py`}
          lines={challenge.code}
          slot={
            hasCodeSlot(challenge)
              ? { marker: CODE_SLOT, value: slotValue }
              : undefined
          }
        />

        <ChoiceList
          legend={challenge.prompt}
          items={challenge.options.map((option) => ({
            id: option.id,
            content: <code className="choice__code">{option.code}</code>,
          }))}
          selectedId={selectedId}
          correctId={challenge.correctOptionId}
          revealed={result !== null}
          onSelect={select}
        />

        {!result && (
          <ActionBar
            hint={selectedId ? 'Logic loaded' : 'Pick the logic'}
            label="Attempt unlock"
            disabled={!selectedId}
            onClick={() => submit(isCorrectOption(challenge, selectedId ?? ''))}
          />
        )}

        {result && (
          <FeedbackPanel
            correct={result.correct}
            xpEarned={result.xpEarned}
            title={result.correct ? 'Lock broken!' : 'Access denied'}
            whyNot={selectedOption?.whyNot}
            isLast={isLast}
            onNext={next}
            headingRef={feedbackRef}
          >
            <dl className="feedback__explanation">
              <dt>Correct logic</dt>
              <dd>
                <code className="feedback__fix-code">{correctOption.code}</code>
              </dd>
              <dt>How it evaluates</dt>
              <dd>
                <InlineCode text={challenge.explanation.evaluation} />
              </dd>
              <dt>Takeaway</dt>
              <dd>
                <InlineCode text={challenge.explanation.concept} />
              </dd>
            </dl>
          </FeedbackPanel>
        )}
      </main>
    </div>
  )
}

export default CodeBreakerScreen
