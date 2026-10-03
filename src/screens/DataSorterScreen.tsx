import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { dataSorterChallenges } from '../content/dataSorterChallenges.ts'
import { useChallengeRun, type RunStart } from '../game/useChallengeRun.ts'
import DataSorterRound from './DataSorterRound.tsx'
import './DataSorterScreen.css'

interface DataSorterScreenProps {
  /** Continue at the first unfinished module, or replay from 01. */
  startAt?: RunStart
  onPlayAgain: (startAt: RunStart) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  challenges?: DataSorterChallenge[]
}

function DataSorterScreen({
  startAt = 'continue',
  onPlayAgain,
  onExit,
  exitLabel = 'Games',
  challenges = dataSorterChallenges,
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
