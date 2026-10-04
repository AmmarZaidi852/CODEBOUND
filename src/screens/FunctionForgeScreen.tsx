import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
import type { CodeChallenge } from '../challenges/code.ts'
import { functionForgeModules } from '../content/gameChallenges.ts'
import GameScreen, { type GameScreenProps } from './GameScreen.tsx'

function FunctionForgeScreen({
  challenges = functionForgeModules,
  ...props
}: GameScreenProps<FunctionForgeChallenge | CodeChallenge>) {
  return (
    <GameScreen
      game="function-forge"
      name="Function Forge"
      summary={{
        title: 'All modules online',
        message:
          'You defined, called, and built Python functions. The forge is running.',
      }}
      challenges={challenges}
      {...props}
    />
  )
}

export default FunctionForgeScreen
