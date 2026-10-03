import { useEffect, useRef, useState } from 'react'
import {
  correctAnswerText,
  isCorrectMicro,
  type Concept,
  type MicroAnswer,
} from '../challenges/foundations.ts'
import ChoiceList from '../components/ChoiceList.tsx'
import ActionBar from '../components/ActionBar.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import ListCells, { type CellState } from '../components/ListCells.tsx'
import TopBar from '../components/TopBar.tsx'
import { games } from '../content/games.ts'
import { XP_CONCEPT } from '../game/xp.ts'
import './ConceptScreen.css'

interface ConceptScreenProps {
  concept: Concept
  /** 0-based position in the foundations. */
  index: number
  total: number
  alreadyCompleted: boolean
  nextTitle: string | null
  onComplete: () => void
  onBack: () => void
  onPractise: () => void
  onNext: () => void
}

interface Result {
  correct: boolean
  xpEarned: number
}

/**
 * One Python Foundations lesson: summary → tiny example → micro-challenge →
 * feedback → practise in a game or move on. Remount (via `key`) per concept.
 */
function ConceptScreen({
  concept,
  index,
  total,
  alreadyCompleted,
  nextTitle,
  onComplete,
  onBack,
  onPractise,
  onNext,
}: ConceptScreenProps) {
  const { micro } = concept
  const [answer, setAnswer] = useState<MicroAnswer | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLHeadingElement>(null)

  // Start each concept at its title (also scrolls it into view).
  useEffect(() => {
    titleRef.current?.focus()
  }, [])
  useEffect(() => {
    if (result) feedbackRef.current?.focus()
  }, [result])

  function check() {
    if (!answer || result) return
    setResult({
      correct: isCorrectMicro(micro, answer),
      xpEarned: alreadyCompleted ? 0 : XP_CONCEPT,
    })
    onComplete()
  }

  const game = games.find((g) => g.id === concept.game)
  const selectedOptionId = answer?.kind === 'choice' ? answer.optionId : null
  const pickedIndex = answer?.kind === 'pick' ? answer.index : null
  const whyNot =
    micro.kind === 'pick'
      ? micro.whyNot
      : micro.options.find((o) => o.id === selectedOptionId)?.whyNot

  function pickState(i: number): CellState {
    if (micro.kind !== 'pick') return ''
    if (!result) return i === pickedIndex ? 'picked' : ''
    if (i === micro.answerIndex) return 'correct'
    return i === pickedIndex ? 'wrong' : ''
  }

  return (
    <div className="screen" data-theme="foundations">
      <TopBar backLabel="Foundations" onBack={onBack} />
      <main className="game">
        <GameHud
          art="foundations"
          name="Python Foundations"
          index={index}
          total={total}
          unit="Lesson"
          status={{
            label: 'Training',
            value: result || alreadyCompleted ? 'Complete' : 'Active',
            state: result || alreadyCompleted ? 'ok' : 'idle',
          }}
        />

        <header className="concept mission panel">
          <p className="mission__id">
            Training module {String(index + 1).padStart(2, '0')}
            {alreadyCompleted && ' · completed'}
          </p>
          <h1 className="game__title" ref={titleRef} tabIndex={-1}>
            {concept.title}
          </h1>
          <p className="concept__summary">
            <InlineCode text={concept.summary} />
          </p>
          {concept.later && (
            <p className="concept__later">
              <span className="mission__label">Later</span> {concept.later}
            </p>
          )}
        </header>

        <div className="concept__example">
          <CodeBlock fileName="example.py" lines={concept.example} />
          <p className="concept__note">
            <InlineCode text={concept.exampleNote} />
          </p>
        </div>

        <section className="concept__try panel" aria-label="Try it">
          <p className="eyebrow">Code terminal · Try it</p>
          {game && (
            <p className="concept__write-note">
              Here you pick the answer. In {game.name}, <strong>Write</strong>{' '}
              modules have you type the code yourself.
            </p>
          )}
          {micro.kind === 'choice' ? (
            <>
              {micro.code && <CodeBlock fileName="try.py" lines={micro.code} />}
              <ChoiceList
                legend={<InlineCode text={micro.prompt} />}
                items={micro.options.map((option) => ({
                  id: option.id,
                  content: <code className="choice__code">{option.code}</code>,
                }))}
                selectedId={selectedOptionId}
                correctId={micro.correctOptionId}
                revealed={result !== null}
                onSelect={(optionId) => setAnswer({ kind: 'choice', optionId })}
              />
            </>
          ) : (
            <>
              <p className="concept__prompt">
                <InlineCode text={micro.prompt} />
              </p>
              <ListCells
                label={micro.list.label}
                values={micro.list.values}
                showIndexes
                onCellClick={(i) => setAnswer({ kind: 'pick', index: i })}
                cellLabel={(value, i) => `Index ${i}: ${value}`}
                cellState={pickState}
                disabled={result !== null}
              />
            </>
          )}
        </section>

        {!result && (
          <ActionBar
            hint={answer ? 'Answer locked in' : 'Choose an answer'}
            label="Check answer"
            disabled={!answer}
            onClick={check}
          />
        )}

        {result && (
          <FeedbackPanel
            correct={result.correct}
            xpEarned={result.xpEarned}
            title={result.correct ? 'Got it!' : 'Not quite'}
            whyNot={whyNot}
            headingRef={feedbackRef}
            actions={
              <div className="feedback__actions">
                {game && (
                  <button
                    type="button"
                    className="btn btn--primary btn--large btn--go"
                    onClick={onPractise}
                  >
                    Practise in {game.name}
                  </button>
                )}
                <button
                  type="button"
                  className={`btn btn--large ${game ? '' : 'btn--primary btn--go'}`}
                  onClick={onNext}
                >
                  {nextTitle
                    ? `Next concept: ${nextTitle}`
                    : 'Back to Foundations'}
                </button>
              </div>
            }
          >
            <dl className="feedback__explanation">
              <dt>Answer</dt>
              <dd>
                <code className="feedback__fix-code">
                  {correctAnswerText(micro)}
                </code>
              </dd>
              <dt>Why</dt>
              <dd>
                <InlineCode text={concept.explanation} />
              </dd>
            </dl>
          </FeedbackPanel>
        )}
      </main>
    </div>
  )
}

export default ConceptScreen
