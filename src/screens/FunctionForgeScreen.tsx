import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
import RunProgress from '../components/RunProgress.tsx'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { functionForgeChallenges } from '../content/functionForgeChallenges.ts'
import { useChallengeRun } from '../game/useChallengeRun.ts'
import FunctionForgeRound from './FunctionForgeRound.tsx'
import './FunctionForgeScreen.css'

interface FunctionForgeScreenProps {
  xp: number
  onEarnXp: (amount: number) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  challenges?: FunctionForgeChallenge[]
}

function FunctionForgeScreen({
  xp,
  onEarnXp,
  onExit,
  exitLabel = 'Games',
  challenges = functionForgeChallenges,
}: FunctionForgeScreenProps) {
  const {
    index,
    isLast,
    result,
    runXp,
    solved,
    finished,
    titleRef,
    feedbackRef,
    submit,
    next,
  } = useChallengeRun(challenges.length, onEarnXp)

  if (finished) {
    return (
      <div className="screen">
        <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          eyebrow="Function Forge · complete"
          title="All modules online"
          message="You defined, called, and built Python functions. The forge is running."
          runXp={runXp}
          total={challenges.length}
          solved={solved}
          onExit={onExit}
          exitLabel={`Back to ${exitLabel.toLowerCase()}`}
        />
      </div>
    )
  }

  const challenge = challenges[index]

  return (
    <div className="screen">
      <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <RunProgress
          label="Function Forge"
          index={index}
          total={challenges.length}
        />
        <FunctionForgeRound
          key={challenge.id}
          challenge={challenge}
          number={index + 1}
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
