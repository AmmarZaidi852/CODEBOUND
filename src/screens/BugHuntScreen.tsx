import { isCodeChallenge, type CodeChallenge } from '../challenges/code.ts'
import {
  getCorrectFix,
  isCorrectFix,
  type BugHuntChallenge,
} from '../challenges/bugHunt.ts'
import ActionBar from '../components/ActionBar.tsx'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { bugHuntModules } from '../content/gameChallenges.ts'
import { useChallengeRun, type RunStart } from '../game/useChallengeRun.ts'
import CodeRound, { type CodeRoundTheme } from './CodeRound.tsx'
import './BugHuntScreen.css'

interface BugHuntScreenProps {
  /** Continue at the first unfinished module, or replay from 01. */
  startAt?: RunStart
  onPlayAgain: (startAt: RunStart) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  /** Modules in play order: this game's challenges and write modules. */
  challenges?: (BugHuntChallenge | CodeChallenge)[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** How this game dresses its "write" modules. */
const codeTheme = (index: number): CodeRoundTheme => ({
  game: 'bug-hunt',
  name: 'Bug Hunt',
  status: {
    label: 'System',
    idle: 'Corrupted',
    ok: 'Patched',
    fail: 'Still corrupted',
  },
  titles: { ok: 'Bug squashed!', fail: 'Not quite' },
  label: `Bug ${pad(index + 1)} · Write the fix`,
})

function BugHuntScreen({
  startAt = 'continue',
  onPlayAgain,
  onExit,
  exitLabel = 'Games',
  challenges = bugHuntModules,
}: BugHuntScreenProps) {
  const {
    index,
    isLast,
    selectedId,
    result,
    states,
    stats,
    finished,
    titleRef,
    feedbackRef,
    select,
    submit,
    retry,
    next,
  } = useChallengeRun('bug-hunt', challenges, startAt)

  if (finished) {
    return (
      <div className="screen" data-theme="bug-hunt">
        <TopBar backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          game="bug-hunt"
          gameName="Bug Hunt"
          title="All bugs squashed"
          message="You worked through every broken script. Nice hunting."
          challengeIds={challenges.map((c) => c.id)}
          stats={stats}
          onExit={onExit}
          exitLabel={`Back to ${exitLabel.toLowerCase()}`}
          onPlayAgain={onPlayAgain}
        />
      </div>
    )
  }

  const challenge = challenges[index]

  if (isCodeChallenge(challenge)) {
    return (
      <div className="screen" data-theme="bug-hunt">
        <TopBar backLabel={exitLabel} onBack={onExit} />
        <main className="game">
          <CodeRound
            key={challenge.id}
            challenge={challenge}
            theme={codeTheme(index)}
            index={index}
            total={challenges.length}
            states={states}
            result={result}
            isLast={isLast}
            onSubmit={submit}
            onRetry={retry}
            onNext={next}
            titleRef={titleRef}
            feedbackRef={feedbackRef}
          />
        </main>
      </div>
    )
  }
  const correctFix = getCorrectFix(challenge)
  const selectedFix = challenge.fixes.find((f) => f.id === selectedId)

  return (
    <div className="screen" data-theme="bug-hunt">
      <TopBar backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <GameHud
          art="bug-hunt"
          name="Bug Hunt"
          index={index}
          total={challenges.length}
          states={states}
          status={{
            label: 'System',
            value: !result
              ? 'Corrupted'
              : result.correct
                ? 'Patched'
                : 'Still corrupted',
            state: !result ? 'idle' : result.correct ? 'ok' : 'fail',
          }}
        />

        <header className="mission panel">
          <p className="mission__id">
            Bug {String(index + 1).padStart(2, '0')} · Find and patch
          </p>
          <h1 className="game__title" ref={titleRef} tabIndex={-1}>
            {challenge.title}
          </h1>
          <p className="mission__objective">{challenge.mission}</p>
          <p className="bug-hunt__expected">
            <span className="mission__label">Expected output</span>
            <code>{challenge.expectedOutput}</code>
          </p>
        </header>

        <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

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
          <ActionBar
            hint={selectedId ? 'Patch loaded' : 'Pick a patch'}
            label="Apply patch"
            disabled={!selectedId}
            onClick={() => submit(isCorrectFix(challenge, selectedId ?? ''))}
          />
        )}

        {result && (
          <FeedbackPanel
            correct={result.correct}
            xpEarned={result.xpEarned}
            mastered={result.mastered}
            replay={result.replay}
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
