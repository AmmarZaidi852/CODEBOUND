import { useState, type RefObject } from 'react'
import {
  isCorrectAnswer,
  type DataAnswer,
  type DataSorterChallenge,
} from '../challenges/dataSorter.ts'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import InlineCode from '../components/InlineCode.tsx'
import ListCells, { type CellState } from '../components/ListCells.tsx'
import type { RunResult } from '../game/useChallengeRun.ts'

interface DataSorterRoundProps {
  challenge: DataSorterChallenge
  number: number
  result: RunResult | null
  isLast: boolean
  onSubmit: (correct: boolean) => void
  onNext: () => void
  titleRef: RefObject<HTMLHeadingElement | null>
  feedbackRef: RefObject<HTMLHeadingElement | null>
}

/**
 * One Data Sorter challenge. Holds the player's in-progress answer
 * (a tapped cell, or a list built from tiles). Remount it per challenge
 * (via `key`) to start each one fresh.
 */
function DataSorterRound({
  challenge,
  number,
  result,
  isLast,
  onSubmit,
  onNext,
  titleRef,
  feedbackRef,
}: DataSorterRoundProps) {
  const { task } = challenge
  const [picked, setPicked] = useState<number | null>(null)
  // Indexes into the tile pool, in the order the player placed them.
  const [placed, setPlaced] = useState<number[]>([])

  const locked = result !== null
  const pool = task.kind === 'build' ? task.pool : []
  const built = placed.map((i) => pool[i])

  let answer: DataAnswer | null = null
  if (task.kind === 'pick' && picked !== null) {
    answer = { kind: 'pick', index: picked }
  } else if (task.kind === 'build' && placed.length > 0) {
    answer = { kind: 'build', values: built }
  }

  function pickState(index: number): CellState {
    if (task.kind !== 'pick') return ''
    if (!locked) return index === picked ? 'picked' : ''
    if (index === task.answerIndex) return 'correct'
    return index === picked ? 'wrong' : ''
  }

  const builtState: CellState = !locked
    ? ''
    : result.correct
      ? 'correct'
      : 'wrong'
  const terminalNumber = String(number).padStart(2, '0')
  // Only worth showing when the code changed the list or produced output.
  const showResult = task.kind === 'build' || challenge.ops !== undefined

  return (
    <>
      <section className="data-terminal">
        <p className="data-terminal__id">Data {challenge.terminal}</p>
        <h1 className="game__title" ref={titleRef} tabIndex={-1}>
          {challenge.name}
        </h1>
        <p className="data-terminal__instruction">
          <InlineCode text={challenge.instruction} />
        </p>
      </section>

      <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

      <CodeBlock
        fileName={`terminal_${terminalNumber}.py`}
        lines={challenge.code}
      />

      <section className="data-panel" aria-label="Data">
        {task.kind === 'pick' ? (
          <>
            <p className="data-panel__hint">Tap a cell</p>
            <ListCells
              label={`${challenge.variable} =`}
              values={challenge.input}
              showIndexes={challenge.showIndexes}
              onCellClick={setPicked}
              cellLabel={(value, i) =>
                challenge.showIndexes ? `Index ${i}: ${value}` : String(value)
              }
              cellState={pickState}
              disabled={locked}
            />
          </>
        ) : (
          <>
            <p className="data-panel__hint">Starting list</p>
            <ListCells
              label={`${challenge.variable} =`}
              values={challenge.input}
              showIndexes={challenge.showIndexes}
            />
            <p className="data-panel__hint">Your answer</p>
            <ListCells
              label={task.targetLabel}
              values={built}
              onCellClick={(i) =>
                setPlaced((current) => current.filter((_, at) => at !== i))
              }
              cellLabel={(value) => `Remove ${value}`}
              cellState={() => builtState}
              disabled={locked}
              placeholder="Tap values below"
            />
            <div className="data-panel__pool" role="group" aria-label="Values">
              {task.pool.map((value, i) => (
                <button
                  key={i}
                  type="button"
                  className="data-tile"
                  aria-label={`Add ${value}`}
                  disabled={locked || placed.includes(i)}
                  onClick={() => setPlaced((current) => [...current, i])}
                >
                  {value}
                </button>
              ))}
              <button
                type="button"
                className="btn btn--ghost data-panel__reset"
                disabled={locked || placed.length === 0}
                onClick={() => setPlaced([])}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </section>

      {!result && (
        <button
          type="button"
          className="btn btn--primary game__submit"
          disabled={!answer}
          onClick={() => answer && onSubmit(isCorrectAnswer(challenge, answer))}
        >
          Submit
        </button>
      )}

      {result && (
        <FeedbackPanel
          correct={result.correct}
          xpEarned={result.xpEarned}
          title={result.correct ? 'Data sorted!' : 'Not quite'}
          whyNot={challenge.explanation.mistake}
          isLast={isLast}
          onNext={onNext}
          headingRef={feedbackRef}
        >
          <dl className="feedback__explanation">
            {showResult && (
              <>
                <dt>Result</dt>
                <dd>
                  <ListCells
                    label={challenge.result.label}
                    values={challenge.result.values}
                  />
                </dd>
              </>
            )}
            <dt>What happened</dt>
            <dd>
              <InlineCode text={challenge.explanation.steps} />
            </dd>
            <dt>Takeaway</dt>
            <dd>
              <InlineCode text={challenge.explanation.concept} />
            </dd>
          </dl>
        </FeedbackPanel>
      )}
    </>
  )
}

export default DataSorterRound
