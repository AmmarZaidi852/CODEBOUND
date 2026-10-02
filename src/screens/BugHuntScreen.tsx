import { useEffect, useRef, useState } from 'react'
import {
  getCorrectFix,
  isCorrectFix,
  type BugHuntChallenge,
} from '../challenges/bugHunt.ts'
import CodeBlock from '../components/CodeBlock.tsx'
import InlineCode from '../components/InlineCode.tsx'
import TopBar from '../components/TopBar.tsx'
import { bugHuntChallenges } from '../content/bugHuntChallenges.ts'
import { xpForResult } from '../game/xp.ts'
import './BugHuntScreen.css'

interface BugHuntScreenProps {
  xp: number
  onEarnXp: (amount: number) => void
  onExit: () => void
  challenges?: BugHuntChallenge[]
}

interface Result {
  correct: boolean
  xpEarned: number
}

function BugHuntScreen({
  xp,
  onEarnXp,
  onExit,
  challenges = bugHuntChallenges,
}: BugHuntScreenProps) {
  const [index, setIndex] = useState(0)
  const [selectedFixId, setSelectedFixId] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [runXp, setRunXp] = useState(0)
  const [solved, setSolved] = useState(0)
  const [finished, setFinished] = useState(false)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLHeadingElement>(null)

  // Move focus (and the viewport) to the new content after each step.
  useEffect(() => {
    if (index > 0) titleRef.current?.focus()
  }, [index])
  useEffect(() => {
    if (result) feedbackRef.current?.focus()
  }, [result])

  const challenge = challenges[index]
  const isLast = index === challenges.length - 1

  function submit() {
    if (!selectedFixId || result) return
    const correct = isCorrectFix(challenge, selectedFixId)
    const xpEarned = xpForResult(correct)
    setResult({ correct, xpEarned })
    setRunXp((total) => total + xpEarned)
    if (correct) setSolved((count) => count + 1)
    onEarnXp(xpEarned)
  }

  function next() {
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setSelectedFixId(null)
    setResult(null)
  }

  if (finished) {
    return (
      <div className="screen">
        <TopBar xp={xp} backLabel="Games" onBack={onExit} />
        <main className="bug-hunt bug-hunt--complete">
          <p className="eyebrow">Bug Hunt · complete</p>
          <h1 className="bug-hunt__complete-title">All bugs squashed</h1>
          <p>You worked through every broken script. Nice hunting.</p>
          <dl className="bug-hunt__stats">
            <div>
              <dt>XP earned</dt>
              <dd>+{runXp}</dd>
            </div>
            <div>
              <dt>Challenges completed</dt>
              <dd>{challenges.length}</dd>
            </div>
            <div>
              <dt>Fixed first try</dt>
              <dd>
                {solved}/{challenges.length}
              </dd>
            </div>
          </dl>
          <button type="button" className="btn btn--primary" onClick={onExit}>
            Back to games
          </button>
        </main>
      </div>
    )
  }

  const selectedFix = challenge.fixes.find((f) => f.id === selectedFixId)
  const correctFix = getCorrectFix(challenge)

  return (
    <div className="screen">
      <TopBar xp={xp} backLabel="Games" onBack={onExit} />
      <main className="bug-hunt">
        <div className="bug-hunt__progress">
          <p className="eyebrow">
            Bug Hunt · {index + 1}/{challenges.length}
          </p>
          <ol className="bug-hunt__pips" aria-hidden="true">
            {challenges.map((c, i) => (
              <li
                key={c.id}
                className={
                  i < index ? 'done' : i === index ? 'current' : undefined
                }
              />
            ))}
          </ol>
        </div>

        <h1 className="bug-hunt__title" ref={titleRef} tabIndex={-1}>
          {challenge.title}
        </h1>

        <section className="bug-hunt__lesson" aria-label="Concept">
          <p className="bug-hunt__concept">{challenge.concept}</p>
          <p>
            <InlineCode text={challenge.lesson} />
          </p>
        </section>

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

        <fieldset className="bug-hunt__fixes" disabled={result !== null}>
          <legend>Choose the patch that fixes the bug</legend>
          {challenge.fixes.map((fix) => {
            const state = !result
              ? fix.id === selectedFixId
                ? 'selected'
                : ''
              : fix.id === correctFix.id
                ? 'correct'
                : fix.id === selectedFixId
                  ? 'wrong'
                  : ''
            return (
              <label key={fix.id} className={`fix-option ${state}`}>
                <input
                  type="radio"
                  name="fix"
                  value={fix.id}
                  checked={fix.id === selectedFixId}
                  onChange={() => setSelectedFixId(fix.id)}
                />
                <span className="fix-option__line">Line {fix.line}</span>{' '}
                <code className="fix-option__code">{fix.code}</code>
              </label>
            )
          })}
        </fieldset>

        {!result && (
          <button
            type="button"
            className="btn btn--primary bug-hunt__submit"
            disabled={!selectedFixId}
            onClick={submit}
          >
            Apply patch
          </button>
        )}

        {result && (
          <section
            className={`feedback ${result.correct ? 'feedback--correct' : 'feedback--wrong'}`}
            aria-live="polite"
          >
            <div className="feedback__header">
              <h2 ref={feedbackRef} tabIndex={-1}>
                {result.correct ? 'Bug squashed!' : 'Not quite'}
              </h2>
              <span className="feedback__xp">+{result.xpEarned} XP</span>
            </div>
            {!result.correct && selectedFix?.whyNot && (
              <p className="feedback__why-not">
                <InlineCode text={selectedFix.whyNot} />
              </p>
            )}
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
            <button type="button" className="btn btn--primary" onClick={next}>
              {isLast ? 'Finish' : 'Next challenge'}
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default BugHuntScreen
