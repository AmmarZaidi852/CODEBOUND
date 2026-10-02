import {
  getCorrectFix,
  isCorrectFix,
  type BugHuntChallenge,
} from '../challenges/bugHunt.ts'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import InlineCode from '../components/InlineCode.tsx'
import RunProgress from '../components/RunProgress.tsx'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { bugHuntChallenges } from '../content/bugHuntChallenges.ts'
import { useChallengeRun } from '../game/useChallengeRun.ts'
import './BugHuntScreen.css'

interface BugHuntScreenProps {
  xp: number
  onEarnXp: (amount: number) => void
  onExit: () => void
  challenges?: BugHuntChallenge[]
}

function BugHuntScreen({
  xp,
  onEarnXp,
  onExit,
  challenges = bugHuntChallenges,
}: BugHuntScreenProps) {
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
          eyebrow="Bug Hunt · complete"
          title="All bugs squashed"
          message="You worked through every broken script. Nice hunting."
          runXp={runXp}
          total={challenges.length}
          solved={solved}
          onExit={onExit}
        />
      </div>
    )
  }

  const challenge = challenges[index]
  const correctFix = getCorrectFix(challenge)
  const selectedFix = challenge.fixes.find((f) => f.id === selectedId)

  return (
    <div className="screen">
      <TopBar xp={xp} backLabel="Games" onBack={onExit} />
      <main className="game">
        <RunProgress label="Bug Hunt" index={index} total={challenges.length} />

        <h1 className="game__title" ref={titleRef} tabIndex={-1}>
          {challenge.title}
        </h1>

        <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

        <div className="bug-hunt__mission">
          <p>
            <strong>Mission:</strong> {challenge.mission}
          </p>
          <p>
            <strong>Expected output:</strong>{' '}
            <code>{challenge.expectedOutput}</code>
          </p>
        </div>

        <CodeBlock
          fileName={`bug_${String(index + 1).padStart(2, '0')}.py`}
          lines={challenge.code}
          highlightLine={result ? correctFix.line : undefined}
        />

        <ChoiceList
          legend="Choose the patch that fixes the bug"
          items={challenge.fixes.map((fix) => ({
            id: fix.id,
            content: (
              <>
                <span className="choice__tag">Line {fix.line}</span>{' '}
                <code className="choice__code">{fix.code}</code>
              </>
            ),
          }))}
          selectedId={selectedId}
          correctId={challenge.correctFixId}
          revealed={result !== null}
          onSelect={select}
        />

        {!result && (
          <button
            type="button"
            className="btn btn--primary game__submit"
            disabled={!selectedId}
            onClick={() => submit(isCorrectFix(challenge, selectedId ?? ''))}
          >
            Apply patch
          </button>
        )}

        {result && (
          <FeedbackPanel
            correct={result.correct}
            xpEarned={result.xpEarned}
            title={result.correct ? 'Bug squashed!' : 'Not quite'}
            whyNot={selectedFix?.whyNot}
            isLast={isLast}
            onNext={next}
            headingRef={feedbackRef}
          >
            <dl className="feedback__explanation">
              <dt>What was wrong</dt>
              <dd>
                <InlineCode text={challenge.explanation.problem} />
              </dd>
              <dt>Why</dt>
              <dd>
                <InlineCode text={challenge.explanation.why} />
              </dd>
              <dt>The fix</dt>
              <dd>
                <code className="feedback__fix-code">
                  Line {correctFix.line}: {correctFix.code}
                </code>
                <InlineCode text={challenge.explanation.fix} />
              </dd>
            </dl>
          </FeedbackPanel>
        )}
      </main>
    </div>
  )
}

export default BugHuntScreen
