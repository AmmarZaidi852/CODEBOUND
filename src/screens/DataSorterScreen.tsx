import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import RunSummary from '../components/RunSummary.tsx'
import TopBar from '../components/TopBar.tsx'
import { dataSorterChallenges } from '../content/dataSorterChallenges.ts'
import { useChallengeRun } from '../game/useChallengeRun.ts'
import DataSorterRound from './DataSorterRound.tsx'
import './DataSorterScreen.css'

interface DataSorterScreenProps {
  xp: number
  onEarnXp: (amount: number) => void
  onExit: () => void
  /** Where leaving the game goes, e.g. "Games" or "Foundations". */
  exitLabel?: string
  challenges?: DataSorterChallenge[]
}

function DataSorterScreen({
  xp,
  onEarnXp,
  onExit,
  exitLabel = 'Games',
  challenges = dataSorterChallenges,
}: DataSorterScreenProps) {
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
      <div className="screen" data-theme="data-sorter">
        <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
        <RunSummary
          art="data-sorter"
          gameName="Data Sorter"
          title="All data sorted"
          message="Every terminal is processed. You can read and reshape lists."
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
    <div className="screen" data-theme="data-sorter">
      <TopBar xp={xp} backLabel={exitLabel} onBack={onExit} />
      <main className="game">
        <DataSorterRound
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

export default DataSorterScreen
