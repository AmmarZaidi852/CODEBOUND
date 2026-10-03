import { isCodeChallenge, type CodeChallenge } from '../challenges/code.ts'
import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { dataSorterModules } from '../content/gameChallenges.ts'
import { useChallengeRun, type RunStart } from '../game/useChallengeRun.ts'
import CodeRound, { type CodeRoundTheme } from './CodeRound.tsx'
import DataSorterRound from './DataSorterRound.tsx'
import './DataSorterScreen.css'

interface DataSorterScreenProps {
  /** Continue at the first unfinished module, or replay from 01. */
  startAt?: RunStart
  onPlayAgain: (startAt: RunStart) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  /** Modules in play order: this game's challenges and write modules. */
  challenges?: (DataSorterChallenge | CodeChallenge)[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** How this game dresses its "write" modules. */
const codeTheme = (index: number): CodeRoundTheme => ({
  game: 'data-sorter',
  name: 'Data Sorter',
  status: {
    label: 'Data core',
    idle: 'Online',
    ok: 'Sorted',
    fail: 'Mismatch',
  },
  titles: { ok: 'Data sorted!', fail: 'Not quite' },
  label: `Data Terminal ${pad(index + 1)} · Write the code`,
})

function DataSorterScreen({
  startAt = 'continue',
  onPlayAgain,
  onExit,
  exitLabel = 'Games',
  challenges = dataSorterModules,
}: DataSorterScreenProps) {
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
  } = useChallengeRun('data-sorter', challenges, startAt)

  if (finished) {
    return (
      <div className="screen" data-theme="data-sorter">
        <TopBar backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          game="data-sorter"
          gameName="Data Sorter"
          title="All data sorted"
          message="Every terminal is processed. You can read and reshape lists."
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

  if (isCodeChallenge(challenge)) {
    return (
      <div className="screen" data-theme="data-sorter">
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
    <div className="screen" data-theme="data-sorter">
      <TopBar backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <DataSorterRound
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

export default DataSorterScreen
