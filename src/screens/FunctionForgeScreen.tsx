import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { functionForgeChallenges } from '../content/functionForgeChallenges.ts'
import { useChallengeRun, type RunStart } from '../game/useChallengeRun.ts'
import FunctionForgeRound from './FunctionForgeRound.tsx'
import './FunctionForgeScreen.css'

interface FunctionForgeScreenProps {
  /** Continue at the first unfinished module, or replay from 01. */
  startAt?: RunStart
  onPlayAgain: (startAt: RunStart) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  challenges?: FunctionForgeChallenge[]
}

function FunctionForgeScreen({
  startAt = 'continue',
  onPlayAgain,
  onExit,
  exitLabel = 'Games',
  challenges = functionForgeChallenges,
}: FunctionForgeScreenProps) {
  const {
    index,
    isLast,
    result,
    states,
    stats,
    finished,
    titleRef,
    feedbackRef,
    submit,
    next,
  } = useChallengeRun('function-forge', challenges, startAt)

  if (finished) {
    return (
      <div className="screen" data-theme="function-forge">
        <TopBar backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          game="function-forge"
          gameName="Function Forge"
          title="All modules online"
          message="You defined, called, and built Python functions. The forge is running."
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

  return (
    <div className="screen" data-theme="function-forge">
      <TopBar backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <FunctionForgeRound
          key={challenge.id}
          challenge={challenge}
          index={index}
          total={challenges.length}
          states={states}
          result={result}
          isLast={isLast}
          onSubmit={submit}
          onNext={next}
          titleRef={titleRef}
          feedbackRef={feedbackRef}
        />
      </main>
    </div>
  )
}

export default FunctionForgeScreen
