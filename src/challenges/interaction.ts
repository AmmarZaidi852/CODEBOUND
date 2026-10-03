import type { BugHuntChallenge } from './bugHunt.ts'
import { isCodeChallenge, type CodeChallenge } from './code.ts'
import { hasCodeSlot, type CodeBreakerChallenge } from './codeBreaker.ts'
import type { DataSorterChallenge } from './dataSorter.ts'
import { FORGE_SLOT, type FunctionForgeChallenge } from './functionForge.ts'
import type { Interaction } from './meta.ts'

/** Any module a game can contain. */
export type GameModule =
  | BugHuntChallenge
  | CodeBreakerChallenge
  | DataSorterChallenge
  | FunctionForgeChallenge
  | CodeChallenge

/**
 * How the player answers a module, read from its own shape so it can
 * never disagree with the content.
 */
export function interactionOf(module: GameModule): Interaction {
  if (isCodeChallenge(module)) return 'write'
  if ('fixes' in module) return 'choose'
  if ('rule' in module) return hasCodeSlot(module) ? 'choose' : 'predict'
  if ('input' in module)
    return module.task.kind === 'build' ? 'build' : 'choose'
  const { task } = module
  if (task.kind !== 'choose') return 'build'
  return module.code.some((line) => line.includes(FORGE_SLOT))
    ? 'choose'
    : 'predict'
}
