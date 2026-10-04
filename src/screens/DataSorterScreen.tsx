import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import type { CodeChallenge } from '../challenges/code.ts'
import { dataSorterModules } from '../content/gameChallenges.ts'
import GameScreen, { type GameScreenProps } from './GameScreen.tsx'

function DataSorterScreen({
  challenges = dataSorterModules,
  ...props
}: GameScreenProps<DataSorterChallenge | CodeChallenge>) {
  return (
    <GameScreen
      game="data-sorter"
      name="Data Sorter"
      summary={{
        title: 'All data sorted',
        message: 'Every terminal is processed. You can read and reshape lists.',
      }}
      challenges={challenges}
      {...props}
    />
  )
}

export default DataSorterScreen
