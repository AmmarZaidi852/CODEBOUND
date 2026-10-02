import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import RunProgress from '../components/RunProgress.tsx'
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
  challenges?: DataSorterChallenge[]
}

function DataSorterScreen({
  xp,
  onEarnXp,
  onExit,
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
      <div className="screen">
        <TopBar xp={xp} backLabel="Games" onBack={onExit} />
        <RunSummary
          eyebrow="Data Sorter · complete"
          title="All data sorted"
          message="Every terminal is processed. You can read and reshape lists."
          runXp={runXp}
          total={challenges.length}
          solved={solved}
          onExit={onExit}
        />
      </div>
    )
  }

  const challenge = challenges[index]

  return (
    <div className="screen">
      <TopBar xp={xp} backLabel="Games" onBack={onExit} />
      <main className="game">
        <RunProgress
          label="Data Sorter"
          index={index}
          total={challenges.length}
        />
        <DataSorterRound
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

export default DataSorterScreen
