import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'
import type { CodeChallenge } from '../challenges/code.ts'
import { codeBreakerModules } from '../content/gameChallenges.ts'
import GameScreen, { type GameScreenProps } from './GameScreen.tsx'

function CodeBreakerScreen({
  challenges = codeBreakerModules,
  ...props
}: GameScreenProps<CodeBreakerChallenge | CodeChallenge>) {
  return (
    <GameScreen
      game="code-breaker"
      name="Code Breaker"
      summary={{
        title: 'All locks broken',
        message: 'Every security node is open. Your logic held up.',
      }}
      challenges={challenges}
      {...props}
    />
  )
}

export default CodeBreakerScreen
