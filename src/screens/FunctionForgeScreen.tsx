import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
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
      <div className="screen" data-theme="function-forge">
        <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          art="function-forge"
          gameName="Function Forge"
          title="All modules online"
          message="You defined, called, and built Python functions. The forge is running."
          xp={xp}
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
    <div className="screen" data-theme="function-forge">
      <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <FunctionForgeRound
          key={challenge.id}
          challenge={challenge}
          index={index}
          total={challenges.length}
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
