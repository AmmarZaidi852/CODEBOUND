import {
  CODE_SLOT,
  getCorrectOption,
  hasCodeSlot,
  isCorrectOption,
  type CodeBreakerChallenge,
} from '../challenges/codeBreaker.ts'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import InlineCode from '../components/InlineCode.tsx'
import RunProgress from '../components/RunProgress.tsx'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { codeBreakerChallenges } from '../content/codeBreakerChallenges.ts'
import { useChallengeRun } from '../game/useChallengeRun.ts'
import './CodeBreakerScreen.css'

interface CodeBreakerScreenProps {
  xp: number
  onEarnXp: (amount: number) => void
  onExit: () => void
  challenges?: CodeBreakerChallenge[]
}

type LockState = 'locked' | 'unlocked' | 'failed'

const lockLabels: Record<LockState, string> = {
  locked: 'Locked',
  unlocked: 'Unlocked',
  failed: 'Still locked',
}

function LockIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d={open ? 'M8 11V7a4 4 0 0 1 7.5-2' : 'M8 11V7a4 4 0 0 1 8 0v4'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" />
    </svg>
  )
}

function CodeBreakerScreen({
  xp,
  onEarnXp,
  onExit,
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
      <div className="screen">
        <TopBar xp={xp} backLabel="Games" onBack={onExit} />
        <RunSummary
          eyebrow="Code Breaker · complete"
          title="All locks broken"
          message="Every security node is open. Your logic held up."
          runXp={runXp}
          total={challenges.length}
          solved={solved}
          onExit={onExit}
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
    <div className="screen">
      <TopBar xp={xp} backLabel="Games" onBack={onExit} />
      <main className="game">
        <RunProgress
          label="Code Breaker"
          index={index}
          total={challenges.length}
        />

        <section className={`access-panel access-panel--${lockState}`}>
          <header className="access-panel__header">
            <div>
              <p className="access-panel__node">Security {challenge.node}</p>
              <h1 className="game__title" ref={titleRef} tabIndex={-1}>
                {challenge.system}
              </h1>
            </div>
            <p className="lock-status" role="status">
              <LockIcon open={lockState === 'unlocked'} />
              {lockLabels[lockState]}
            </p>
          </header>
          <p className="access-panel__rule">
            <span className="access-panel__label">Rule</span>
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
          <button
            type="button"
            className="btn btn--primary game__submit"
            disabled={!selectedId}
            onClick={() => submit(isCorrectOption(challenge, selectedId ?? ''))}
          >
            Attempt unlock
          </button>
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
