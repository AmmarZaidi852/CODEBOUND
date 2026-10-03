import { isCodeChallenge, type CodeChallenge } from '../challenges/code.ts'
import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { functionForgeModules } from '../content/gameChallenges.ts'
import { useChallengeRun, type RunStart } from '../game/useChallengeRun.ts'
import CodeRound, { type CodeRoundTheme } from './CodeRound.tsx'
import FunctionForgeRound from './FunctionForgeRound.tsx'
import './FunctionForgeScreen.css'

interface FunctionForgeScreenProps {
  /** Continue at the first unfinished module, or replay from 01. */
  startAt?: RunStart
  onPlayAgain: (startAt: RunStart) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  /** Modules in play order: this game's challenges and write modules. */
  challenges?: (FunctionForgeChallenge | CodeChallenge)[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** How this game dresses its "write" modules. */
const codeTheme = (index: number): CodeRoundTheme => ({
  game: 'function-forge',
  name: 'Function Forge',
  status: {
    label: 'Forge',
    idle: 'Ready',
    ok: 'Online',
    fail: 'Fault',
  },
  titles: { ok: 'Module online!', fail: 'Module fault' },
  label: `Function Module ${pad(index + 1)} · Write the function`,
})

function FunctionForgeScreen({
  startAt = 'continue',
  onPlayAgain,
  onExit,
  exitLabel = 'Games',
  challenges = functionForgeModules,
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
    retry,
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
          modules={challenges}
          stats={stats}
          onExit={onExit}
          exitLabel={`Back to ${exitLabel.toLowerCase()}`}
          onPlayAgain={onPlayAgain}
        />
      </div>
    )
  }

  const challenge = challenges[index]

  if (isCodeChallenge(challenge)) {
    return (
      <div className="screen" data-theme="function-forge">
        <TopBar backLabel={exitLabel} onBack={onExit} />
        <main className="game">
          <CodeRound
            key={challenge.id}
            challenge={challenge}
            theme={codeTheme(index)}
            index={index}
            total={challenges.length}
            states={states}
            result={result}
            isLast={isLast}
            onSubmit={submit}
            onRetry={retry}
            onNext={next}
            titleRef={titleRef}
            feedbackRef={feedbackRef}
          />
        </main>
      </div>
    )
  }

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
