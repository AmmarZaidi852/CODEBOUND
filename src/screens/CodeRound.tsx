import { useMemo, useRef, useState, type RefObject } from 'react'
import {
  checkCode,
  resultName,
  starterSource,
  type CodeChallenge,
  type CodeVerdict,
} from '../challenges/code.ts'
import ActionBar from '../components/ActionBar.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import CodeTerminal from '../components/CodeTerminal.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import ListCells from '../components/ListCells.tsx'
import type { GameId } from '../content/games.ts'
import type { RunResult } from '../game/useChallengeRun.ts'
import { runProgram } from '../python/interpreter.ts'
import type { ChallengeState } from '../progression/progress.ts'
import './CodeRound.css'

/** How a game dresses its "write" modules. */
export interface CodeRoundTheme {
  game: GameId
  name: string
  status: { label: string; idle: string; ok: string; fail: string }
  titles: { ok: string; fail: string }
  /** Mission label for this module, e.g. "Bug 03 · Write the fix". */
  label: string
}

interface CodeRoundProps {
  challenge: CodeChallenge
  theme: CodeRoundTheme
  index: number
  total: number
  states: readonly ChallengeState[]
  result: RunResult | null
  isLast: boolean
  onSubmit: (correct: boolean, hinted: boolean) => void
  onRetry: () => void
  onNext: () => void
  titleRef: RefObject<HTMLHeadingElement | null>
  feedbackRef: RefObject<HTMLHeadingElement | null>
}

/** The list a challenge starts from, by running its starter code. */
function startingList(challenge: CodeChallenge): number[] | null {
  if (!challenge.listVariable) return null
  const value = runProgram(starterSource(challenge)).globals.get(
    challenge.listVariable,
  )
  if (!value || value.t !== 'list') return null
  return value.items.map((item) => (item.t === 'int' ? item.v : 0))
}

/**
 * One "write" module: edit real Python, Check it, read what the checker
 * found, retry or reveal the solution. Remount (via `key`) per challenge.
 */
function CodeRound({
  challenge,
  theme,
  index,
  total,
  states,
  result,
  isLast,
  onSubmit,
  onRetry,
  onNext,
  titleRef,
  feedbackRef,
}: CodeRoundProps) {
  const starter = starterSource(challenge)
  const [source, setSource] = useState(starter)
  const [verdict, setVerdict] = useState<CodeVerdict | null>(null)
  const [checked, setChecked] = useState<string | null>(null)
  const [checks, setChecks] = useState(0)
  const [hints, setHints] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const editorId = `code-${challenge.id}`
  const editorRef = useRef<HTMLDivElement>(null)
  const before = useMemo(() => startingList(challenge), [challenge])

  const solved = result?.correct === true
  const failed = result !== null && !result.correct
  const editing = result === null
  const changed = source.trim() !== '' && source !== starter
  const canCheck = editing && changed && source !== checked

  function check() {
    if (!canCheck) return
    const v = checkCode(challenge, source)
    setVerdict(v)
    setChecked(source)
    setChecks((n) => n + 1)
    onSubmit(v.correct, hints > 0)
  }

  function tryAgain() {
    onRetry()
    setRevealed(false)
    // Back to the editor, ready to type.
    requestAnimationFrame(() =>
      editorRef.current?.querySelector('textarea')?.focus(),
    )
  }

  const status = !result ? 'idle' : result.correct ? 'ok' : 'fail'
  const given = challenge.showGiven ? challenge.tests[0].given : undefined

  return (
    <>
      <GameHud
        art={theme.game}
        name={theme.name}
        index={index}
        total={total}
        states={states}
        status={{
          label: theme.status.label,
          value: theme.status[status],
          state: status,
        }}
      />

      <section className="mission panel">
        <p className="mission__id">
          {theme.label}
          <span className="code-round__mode">Write</span>
        </p>
        <h1 className="game__title" ref={titleRef} tabIndex={-1}>
          {challenge.title}
        </h1>
        <p className="mission__objective" id={`${editorId}-mission`}>
          <InlineCode text={challenge.mission} />
        </p>
        <p className="code-round__goal" id={`${editorId}-goal`}>
          <span className="mission__label">Goal</span>{' '}
          <InlineCode text={challenge.goal} />
        </p>
        {challenge.constraint && (
          <p className="code-round__goal">
            <span className="mission__label">Rule</span>{' '}
            <InlineCode text={challenge.constraint} />
          </p>
        )}
        {given && (
          <dl className="code-round__given" aria-label="System state">
            {Object.entries(given).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {given && challenge.tests.length > 1 && (
          <p className="code-round__note">
            The system tests your code with other values too.
          </p>
        )}
      </section>

      <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

      {before && (
        <section className="code-round__data panel" aria-label="Data">
          <p className="hint-label">Starting list</p>
          <ListCells
            label={`${challenge.listVariable} =`}
            values={before}
            showIndexes
          />
        </section>
      )}

      <div ref={editorRef}>
        <CodeTerminal
          id={editorId}
          fileName={`${challenge.id.replaceAll('-', '_')}.py`}
          value={source}
          onChange={setSource}
          readOnly={!editing}
          onReset={() => setSource(starter)}
          resetDisabled={source === starter}
          state={solved ? 'ok' : failed ? 'fail' : ''}
          describedBy={`${editorId}-mission ${editorId}-goal`}
        />
      </div>

      <section className="code-round__hints" aria-label="Hints">
        <div className="code-round__hint-bar">
          <button
            type="button"
            className="btn"
            disabled={hints >= challenge.hints.length || solved}
            aria-label={
              hints >= challenge.hints.length
                ? 'All hints shown'
                : `Show hint ${hints + 1} of ${challenge.hints.length}`
            }
            onClick={() => setHints((n) => n + 1)}
          >
            Hint {Math.min(hints + 1, challenge.hints.length)}/
            {challenge.hints.length}
          </button>
          <p className="code-round__hint-rule">
            {hints === 0
              ? 'Hints are free, but a module solved with a hint is not mastered.'
              : 'Hint used: this module will not be mastered this time.'}
          </p>
        </div>
        {hints > 0 && (
          <ol className="code-round__hint-list" aria-live="polite">
            {challenge.hints.slice(0, hints).map((hint, i) => (
              <li key={i}>
                <span className="code-round__hint-n">Hint {i + 1}</span>
                <InlineCode text={hint} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {editing && (
        <ActionBar
          hint={
            !changed
              ? 'Edit the code first'
              : source === checked
                ? 'Change something, then check'
                : 'Ready to check'
          }
          label="Check code"
          disabled={!canCheck}
          onClick={check}
        />
      )}

      {result && verdict && (
        <FeedbackPanel
          correct={result.correct}
          xpEarned={result.xpEarned}
          mastered={result.mastered}
          // A retry in this session is not a "replay" of an old run.
          replay={result.replay && checks === 1}
          title={result.correct ? theme.titles.ok : theme.titles.fail}
          whyNot={verdict.message}
          isLast={isLast}
          onNext={onNext}
          headingRef={feedbackRef}
          actions={
            failed && !revealed ? (
              <div className="feedback__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--large btn--go"
                  onClick={tryAgain}
                >
                  Try again
                </button>
                <button
                  type="button"
                  className="btn btn--large"
                  onClick={() => setRevealed(true)}
                >
                  Show solution
                </button>
              </div>
            ) : failed ? (
              <div className="feedback__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--large btn--go"
                  onClick={onNext}
                >
                  {isLast ? 'Finish' : 'Next challenge'}
                </button>
                <button
                  type="button"
                  className="btn btn--large"
                  onClick={tryAgain}
                >
                  Try again
                </button>
              </div>
            ) : undefined
          }
        >
          <dl className="feedback__explanation">
            {verdict.error && (
              <>
                <dt>Error</dt>
                <dd>
                  <code className="code-round__error">{verdict.error}</code>
                </dd>
              </>
            )}
            {(verdict.output.length > 0 ||
              (!verdict.error && !challenge.listVariable)) && (
              <>
                <dt>Your output</dt>
                <dd>
                  <pre className="code-round__output">
                    {verdict.output.length
                      ? verdict.output.join('\n')
                      : '(nothing printed)'}
                  </pre>
                </dd>
              </>
            )}
            {verdict.list && resultName(challenge) && (
              <>
                <dt>Your result</dt>
                <dd>
                  <ListCells
                    label={`${resultName(challenge)} =`}
                    values={verdict.list}
                    showIndexes
                  />
                </dd>
              </>
            )}
            {solved && (
              <>
                <dt>How it works</dt>
                <dd>
                  <InlineCode text={challenge.explanation.steps} />
                </dd>
                <dt>Takeaway</dt>
                <dd>
                  <InlineCode text={challenge.explanation.concept} />
                </dd>
              </>
            )}
          </dl>
          {revealed && (
            <div className="code-round__solution">
              <p className="hint-label">A working solution</p>
              <CodeBlock fileName="solution.py" lines={challenge.solution} />
              <p>
                <InlineCode text={challenge.explanation.steps} />
              </p>
            </div>
          )}
        </FeedbackPanel>
      )}
    </>
  )
}

export default CodeRound
