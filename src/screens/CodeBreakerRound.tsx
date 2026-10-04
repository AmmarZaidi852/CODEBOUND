import { useState } from 'react'
import {
  CODE_SLOT,
  getCorrectOption,
  hasCodeSlot,
  isCorrectOption,
  type CodeBreakerChallenge,
} from '../challenges/codeBreaker.ts'
import { missionTier } from '../challenges/meta.ts'
import ActionBar from '../components/ActionBar.tsx'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import type { StatusState } from '../components/StatusBadge.tsx'
import TierTag, { BossStrip } from '../components/TierTag.tsx'
import type { RoundProps } from './roundProps.ts'
import './CodeBreakerScreen.css'

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

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * One Code Breaker lock: pick the logic for the slot, or predict the output.
 * Holds the chosen option. Remount it per challenge (via `key`).
 */
function CodeBreakerRound({
  challenge,
  index,
  total,
  states,
  result,
  isLast,
  onSubmit,
  onNext,
  titleRef,
  feedbackRef,
  hud = { art: 'code-breaker', name: 'Code Breaker' },
}: RoundProps & { challenge: CodeBreakerChallenge }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
    <>
      <GameHud
        art={hud.art}
        name={hud.name}
        index={index}
        total={total}
        states={states}
        status={{
          label: 'Security',
          value: lockLabels[lockState],
          state: lockStates[lockState],
        }}
      />

      <section
        className={`mission panel access-panel--${lockState}${missionTier(challenge.tier)}`}
      >
        <BossStrip tier={challenge.tier} />
        <p className="mission__id">
          Security Node {pad(index + 1)} · Break the lock
          <TierTag tier={challenge.tier} />
        </p>
        <h1 className="game__title" ref={titleRef} tabIndex={-1}>
          {challenge.system}
        </h1>
        <p className="mission__objective">
          <span className="mission__label">Rule</span> {challenge.rule}
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
        fileName={`node_${pad(index + 1)}.py`}
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
        onSelect={(id) => !result && setSelectedId(id)}
      />

      {!result && (
        <ActionBar
          hint={selectedId ? 'Logic loaded' : 'Pick the logic'}
          label="Attempt unlock"
          disabled={!selectedId}
          onClick={() => onSubmit(isCorrectOption(challenge, selectedId ?? ''))}
        />
      )}

      {result && (
        <FeedbackPanel
          correct={result.correct}
          xpEarned={result.xpEarned}
          mastered={result.mastered}
          recovered={result.recovered}
          replay={result.replay}
          title={result.correct ? 'Lock broken!' : 'Access denied'}
          whyNot={selectedOption?.whyNot}
          isLast={isLast}
          onNext={onNext}
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
    </>
  )
}

export default CodeBreakerRound
