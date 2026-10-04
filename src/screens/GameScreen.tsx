import type { GameModule } from '../challenges/interaction.ts'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import type { GameId } from '../content/games.ts'
import { useChallengeRun, type RunStart } from '../game/useChallengeRun.ts'
import { codeThemes } from './codeThemes.ts'
import ModuleRound from './ModuleRound.tsx'

/** What every game screen accepts from App. */
export interface GameScreenProps<M extends GameModule> {
  /** Continue at the first unfinished module, or replay from 01. */
  startAt?: RunStart
  onPlayAgain: (startAt: RunStart) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  /** Modules in play order: this game's challenges and write modules. */
  challenges?: M[]
}

interface Props<M extends GameModule> extends GameScreenProps<M> {
  game: GameId
  name: string
  challenges: M[]
  /** Completion screen heading and message. */
  summary: { title: string; message: string }
}

/** One game: a run through its modules, then the completion screen. */
function GameScreen<M extends GameModule>({
  game,
  name,
  summary,
  startAt = 'continue',
  onPlayAgain,
  onExit,
  exitLabel = 'Games',
  challenges,
}: Props<M>) {
  const run = useChallengeRun(game, challenges, startAt)

  if (run.finished) {
    return (
      <div className="screen" data-theme={game}>
        <TopBar backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          game={game}
          gameName={name}
          title={summary.title}
          message={summary.message}
          modules={challenges}
          stats={run.stats}
          onExit={onExit}
          exitLabel={`Back to ${exitLabel.toLowerCase()}`}
          onPlayAgain={onPlayAgain}
        />
      </div>
    )
  }

  const module = challenges[run.index]
  return (
    <div className="screen" data-theme={game}>
      <TopBar backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <ModuleRound
          key={module.id}
          module={module}
          theme={codeThemes[game](run.index)}
          index={run.index}
          total={challenges.length}
          states={run.states}
          result={run.result}
          isLast={run.isLast}
          onSubmit={run.submit}
          onRetry={run.retry}
          onNext={run.next}
          titleRef={run.titleRef}
          feedbackRef={run.feedbackRef}
        />
      </main>
    </div>
  )
}

export default GameScreen
