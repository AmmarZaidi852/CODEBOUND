import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import type { CodeChallenge } from '../challenges/code.ts'
import { bugHuntModules } from '../content/gameChallenges.ts'
import GameScreen, { type GameScreenProps } from './GameScreen.tsx'

function BugHuntScreen({
  challenges = bugHuntModules,
  ...props
}: GameScreenProps<BugHuntChallenge | CodeChallenge>) {
  return (
    <GameScreen
      game="bug-hunt"
      name="Bug Hunt"
      summary={{
        title: 'All bugs squashed',
        message: 'You worked through every broken script. Nice hunting.',
      }}
      challenges={challenges}
      {...props}
    />
  )
}

export default BugHuntScreen
