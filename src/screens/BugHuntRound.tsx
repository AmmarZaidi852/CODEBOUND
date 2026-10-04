import { useState } from 'react'
import {
  getCorrectFix,
  isCorrectFix,
  type BugHuntChallenge,
} from '../challenges/bugHunt.ts'
import { missionTier } from '../challenges/meta.ts'
import ActionBar from '../components/ActionBar.tsx'
import ChoiceList from '../components/ChoiceList.tsx'
import CodeBlock from '../components/CodeBlock.tsx'
import ConceptCard from '../components/ConceptCard.tsx'
import FeedbackPanel from '../components/FeedbackPanel.tsx'
import GameHud from '../components/GameHud.tsx'
import InlineCode from '../components/InlineCode.tsx'
import TierTag, { BossStrip } from '../components/TierTag.tsx'
import type { RoundProps } from './roundProps.ts'
import './BugHuntScreen.css'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * One Bug Hunt challenge: pick the patch that fixes the script.
 * Holds the chosen patch. Remount it per challenge (via `key`).
 */
function BugHuntRound({
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
  hud = { art: 'bug-hunt', name: 'Bug Hunt' },
}: RoundProps & { challenge: BugHuntChallenge }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const correctFix = getCorrectFix(challenge)
  const selectedFix = challenge.fixes.find((f) => f.id === selectedId)

  return (
    <>
      <GameHud
        art={hud.art}
        name={hud.name}
        index={index}
        total={total}
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

      <header className={`mission panel${missionTier(challenge.tier)}`}>
        <BossStrip tier={challenge.tier} />
        <p className="mission__id">
          Bug {pad(index + 1)} · Find and patch
          <TierTag tier={challenge.tier} />
        </p>
        <h1 className="game__title" ref={titleRef} tabIndex={-1}>
          {challenge.title}
        </h1>
        <p className="mission__objective">{challenge.mission}</p>
        <p className="bug-hunt__expected">
          <span className="mission__label">Expected output</span>{' '}
          <code>{challenge.expectedOutput}</code>
        </p>
      </header>

      <ConceptCard concept={challenge.concept} lesson={challenge.lesson} />

      <CodeBlock
        fileName={`bug_${pad(index + 1)}.py`}
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
        onSelect={(id) => !result && setSelectedId(id)}
      />

      {!result && (
        <ActionBar
          hint={selectedId ? 'Patch loaded' : 'Pick a patch'}
          label="Apply patch"
          disabled={!selectedId}
          onClick={() => onSubmit(isCorrectFix(challenge, selectedId ?? ''))}
        />
      )}

      {result && (
        <FeedbackPanel
          correct={result.correct}
          xpEarned={result.xpEarned}
          mastered={result.mastered}
          recovered={result.recovered}
          replay={result.replay}
          title={result.correct ? 'Bug squashed!' : 'Not quite'}
          whyNot={selectedFix?.whyNot}
          isLast={isLast}
          onNext={onNext}
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
    </>
  )
}

export default BugHuntRound
