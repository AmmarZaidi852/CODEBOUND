import { isCodeChallenge } from '../challenges/code.ts'
import type { GameModule } from '../challenges/interaction.ts'
import BugHuntRound from './BugHuntRound.tsx'
import CodeBreakerRound from './CodeBreakerRound.tsx'
import CodeRound, { type CodeRoundTheme } from './CodeRound.tsx'
import DataSorterRound from './DataSorterRound.tsx'
import FunctionForgeRound from './FunctionForgeRound.tsx'
import type { RoundProps } from './roundProps.ts'

interface ModuleRoundProps extends RoundProps {
  module: GameModule
  /** Dresses a write module (status words, titles, label). */
  theme: CodeRoundTheme
  onRetry: () => void
}

/**
 * Any module of any game, rendered by its own round. Remount it per
 * module (via `key`) so each one starts fresh.
 */
function ModuleRound({ module, theme, onRetry, ...props }: ModuleRoundProps) {
  if (isCodeChallenge(module)) {
    return (
      <CodeRound
        challenge={module}
        theme={theme}
        onRetry={onRetry}
        {...props}
      />
    )
  }
  if ('fixes' in module) return <BugHuntRound challenge={module} {...props} />
  if ('rule' in module)
    return <CodeBreakerRound challenge={module} {...props} />
  if ('input' in module)
    return <DataSorterRound challenge={module} {...props} />
  return <FunctionForgeRound challenge={module} {...props} />
}

export default ModuleRound
