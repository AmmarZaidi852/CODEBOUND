import { useState, type RefObject } from 'react'
import {
  correctForgeCode,
  fillSlot,
  FORGE_SLOT,
  formatTokens,
  isCorrectForgeAnswer,
  type ForgeAnswer,
  type FunctionForgeChallenge,
} from '../challenges/functionForge.ts'
import ActionBar from '../components/ActionBar.tsx'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import FunctionPipeline from '../components/FunctionPipeline.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import type { RunResult } from '../game/useChallengeRun.ts'

interface FunctionForgeRoundProps {
  challenge: FunctionForgeChallenge
  index: number
  total: number
  result: RunResult | null
  isLast: boolean
  onSubmit: (correct: boolean) => void
  onNext: () => void
  titleRef: RefObject<HTMLHeadingElement | null>
  feedbackRef: RefObject<HTMLHeadingElement | null>
}

const statusLabels = { idle: 'Ready', online: 'Online', fault: 'Fault' }
const statusStates = { idle: 'idle', online: 'ok', fault: 'fail' } as const

/**
 * One Function Forge module. Holds the player's in-progress answer
 * (placed tokens, a chosen option, or arguments). Remount it per challenge
 * (via `key`) to start each one fresh.
 */
function FunctionForgeRound({
  challenge,
  index,
  total,
  result,
  isLast,
  onSubmit,
  onNext,
  titleRef,
  feedbackRef,
}: FunctionForgeRoundProps) {
  const { task, call } = challenge
  // Assemble: indexes into task.tokens, in placement order.
  const [placed, setPlaced] = useState<number[]>([])
  // Choose: the selected option.
  const [optionId, setOptionId] = useState<string | null>(null)
  // Args: tile index per parameter slot.
  const [argTiles, setArgTiles] = useState<(number | null)[]>(
    task.kind === 'args' ? task.params.map(() => null) : [],
  )

  const locked = result !== null
  const tokens =
    task.kind === 'assemble' ? placed.map((i) => task.tokens[i]) : []
  const args =
    task.kind === 'args'
      ? argTiles.map((i) => (i === null ? null : task.tiles[i]))
      : []

  let answer: ForgeAnswer | null = null
  if (task.kind === 'assemble' && placed.length > 0) {
    answer = { kind: 'assemble', tokens }
  } else if (task.kind === 'choose' && optionId) {
    answer = { kind: 'choose', optionId }
  } else if (task.kind === 'args' && args.every((a) => a !== null)) {
    answer = { kind: 'args', args: args as string[] }
  }

  function placeArg(tile: number) {
    setArgTiles((current) => {
      const slot = current.indexOf(null)
      if (slot === -1) return current
      const next = [...current]
      next[slot] = tile
      return next
    })
  }

  // Code shown in the editor, with the player's answer slotted in.
  let codeLines = challenge.code
  let slot: { marker: string; value: string | null } | undefined
  if (task.kind === 'assemble') {
    codeLines = fillSlot(
      challenge.code,
      tokens.length ? formatTokens(tokens) : FORGE_SLOT,
    )
  } else if (task.kind === 'choose') {
    const shown = locked
      ? correctForgeCode(challenge)
      : task.options.find((o) => o.id === optionId)?.code
    slot = { marker: FORGE_SLOT, value: shown ?? null }
  } else {
    slot = {
      marker: FORGE_SLOT,
      value: args.some((a) => a !== null)
        ? args.map((a) => a ?? '?').join(', ')
        : null,
    }
  }

  // Pipeline: what goes in, and (once run) what comes out.
  let output: string | null = null
  if (locked && call) {
    output = task.kind === 'args' ? task.run(args as string[]) : call.output
  }
  const status = !locked ? 'idle' : result.correct ? 'online' : 'fault'
  const whyNot =
    task.kind === 'choose'
      ? task.options.find((o) => o.id === optionId)?.whyNot
      : challenge.explanation.mistake

  return (
    <>
      <GameHud
        art="function-forge"
        name="Function Forge"
        index={index}
        total={total}
        status={{
          label: 'Forge',
          value: statusLabels[status],
          state: statusStates[status],
        }}
      />

      <section className={`mission panel forge-module--${status}`}>
        <p className="mission__id">Function {challenge.module} · Build</p>
        <h1 className="game__title" ref={titleRef} tabIndex={-1}>
          {challenge.title}
        </h1>
        <p className="mission__objective">
          <InlineCode text={challenge.instruction} />
        </p>
      </section>

      <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

      <CodeBlock
        fileName={`module_${String(index + 1).padStart(2, '0')}.py`}
        lines={codeLines}
        slot={slot}
      />

      {call && (
        <FunctionPipeline
          name={call.name}
          inputs={task.kind === 'args' ? args : call.args}
          output={output}
          state={!locked ? '' : result.correct ? 'ok' : 'fault'}
          target={task.kind === 'args' ? task.target : undefined}
        />
      )}

      <section className="forge-bench panel" aria-label="Workbench">
        {task.kind === 'assemble' && (
          <>
            <p className="hint-label">Tap tokens in order</p>
            <div
              className="forge-bench__built"
              role="group"
              aria-label="Your code"
            >
              {placed.length === 0 && (
                <span className="forge-bench__empty">Nothing forged yet</span>
              )}
              {placed.map((tokenIndex, at) => (
                <button
                  key={at}
                  type="button"
                  className="forge-token forge-token--placed"
                  aria-label={`Remove ${task.tokens[tokenIndex]}`}
                  disabled={locked}
                  onClick={() =>
                    setPlaced((current) => current.filter((_, i) => i !== at))
                  }
                >
                  {task.tokens[tokenIndex]}
                </button>
              ))}
            </div>
            <div className="forge-bench__pool" role="group" aria-label="Tokens">
              {task.tokens.map((token, i) => (
                <button
                  key={i}
                  type="button"
                  className="forge-token"
                  aria-label={`Add ${token}`}
                  disabled={locked || placed.includes(i)}
                  onClick={() => setPlaced((current) => [...current, i])}
                >
                  {token}
                </button>
              ))}
              <button
                type="button"
                className="btn btn--ghost forge-bench__reset"
                disabled={locked || placed.length === 0}
                onClick={() => setPlaced([])}
              >
                Reset
              </button>
            </div>
          </>
        )}

        {task.kind === 'args' && (
          <>
            <p className="hint-label">Fill the arguments</p>
            <div className="forge-call" role="group" aria-label="Call">
              <span className="forge-call__name">{call?.name}(</span>
              {task.params.map((param, slotIndex) => {
                const value = args[slotIndex]
                return (
                  <span key={param} className="forge-call__slot">
                    {slotIndex > 0 && <span aria-hidden="true">, </span>}
                    <button
                      type="button"
                      className={`forge-token forge-call__arg${value === null ? ' forge-call__arg--empty' : ''}`}
                      aria-label={
                        value === null
                          ? `${param}: empty`
                          : `${param}: ${value}, tap to clear`
                      }
                      disabled={locked || value === null}
                      onClick={() =>
                        setArgTiles((current) =>
                          current.map((t, i) => (i === slotIndex ? null : t)),
                        )
                      }
                    >
                      <span className="forge-call__param">{param}</span>
                      {value ?? '?'}
                    </button>
                  </span>
                )
              })}
              <span className="forge-call__name">)</span>
            </div>
            <div className="forge-bench__pool" role="group" aria-label="Values">
              {task.tiles.map((tile, i) => (
                <button
                  key={i}
                  type="button"
                  className="forge-token"
                  aria-label={`Pass ${tile}`}
                  disabled={
                    locked || argTiles.includes(i) || !argTiles.includes(null)
                  }
                  onClick={() => placeArg(i)}
                >
                  {tile}
                </button>
              ))}
            </div>
          </>
        )}

        {task.kind === 'choose' && (
          <ChoiceList
            legend={<InlineCode text={task.prompt} />}
            items={task.options.map((option) => ({
              id: option.id,
              content: <code className="choice__code">{option.code}</code>,
            }))}
            selectedId={optionId}
            correctId={task.correctOptionId}
            revealed={locked}
            onSelect={setOptionId}
          />
        )}
      </section>

      {!result && (
        <ActionBar
          hint={answer ? 'Module configured' : 'Configure the module'}
          label="Run module"
          disabled={!answer}
          onClick={() =>
            answer && onSubmit(isCorrectForgeAnswer(challenge, answer))
          }
        />
      )}

      {result && (
        <FeedbackPanel
          correct={result.correct}
          xpEarned={result.xpEarned}
          title={result.correct ? 'Module online!' : 'Module fault'}
          whyNot={whyNot}
          isLast={isLast}
          onNext={onNext}
          headingRef={feedbackRef}
        >
          <dl className="feedback__explanation">
            <dt>Correct code</dt>
            <dd>
              <code className="feedback__fix-code forge-code">
                {correctForgeCode(challenge)}
              </code>
            </dd>
            <dt>How it works</dt>
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

export default FunctionForgeRound
