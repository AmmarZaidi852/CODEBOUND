import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import type { CodeChallenge } from '../challenges/code.ts'
import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'
import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
import { bugHuntChallenges as bh } from './bugHuntChallenges.ts'
import {
  accessRule,
  adder,
  brokenBadge,
  doubler,
  fixReading,
  queueIntake,
  ticketTotal,
  useIt,
  vaultThreshold,
} from './codeChallenges.ts'
import { codeBreakerChallenges as cb } from './codeBreakerChallenges.ts'
import { dataSorterChallenges as ds } from './dataSorterChallenges.ts'
import { functionForgeChallenges as ff } from './functionForgeChallenges.ts'
import type { GameId } from './games.ts'

/*
 * Each game's modules in play order: its own challenges with "write"
 * modules placed right after the challenge that introduces the idea,
 * so the player chooses or builds first, then writes it.
 */

const byId = <T extends { id: string }>(list: T[], id: string) =>
  list.find((c) => c.id === id)!

export const bugHuntModules: (BugHuntChallenge | CodeChallenge)[] = [
  byId(bh, 'variables'),
  byId(bh, 'arithmetic'),
  ticketTotal,
  byId(bh, 'strings'),
  brokenBadge,
  byId(bh, 'booleans'),
  byId(bh, 'if-else'),
]

export const codeBreakerModules: (CodeBreakerChallenge | CodeChallenge)[] = [
  byId(cb, 'basic-if'),
  byId(cb, 'comparisons'),
  vaultThreshold,
  byId(cb, 'if-elif-else'),
  byId(cb, 'and-or'),
  accessRule,
  byId(cb, 'combined'),
]

export const dataSorterModules: (DataSorterChallenge | CodeChallenge)[] = [
  byId(ds, 'lists'),
  byId(ds, 'indexing'),
  byId(ds, 'set-item'),
  fixReading,
  byId(ds, 'append'),
  queueIntake,
  byId(ds, 'pop'),
  byId(ds, 'combined'),
  byId(ds, 'for-loop'),
]

export const functionForgeModules: (FunctionForgeChallenge | CodeChallenge)[] =
  [
    byId(ff, 'define'),
    byId(ff, 'call'),
    byId(ff, 'one-parameter'),
    byId(ff, 'return'),
    doubler,
    byId(ff, 'multiple-parameters'),
    adder,
    byId(ff, 'predict'),
    byId(ff, 'build'),
    useIt,
  ]

/** How many "write" modules each game has, for the cartridge label. */
export const writeModuleCounts: Record<GameId, number> = {
  'bug-hunt': bugHuntModules.filter((m) => 'kind' in m).length,
  'code-breaker': codeBreakerModules.filter((m) => 'kind' in m).length,
  'data-sorter': dataSorterModules.filter((m) => 'kind' in m).length,
  'function-forge': functionForgeModules.filter((m) => 'kind' in m).length,
}

/** Every game's module ids, in play order. Used to read saved progress. */
export const gameChallengeIds: Record<GameId, readonly string[]> = {
  'bug-hunt': bugHuntModules.map((c) => c.id),
  'code-breaker': codeBreakerModules.map((c) => c.id),
  'data-sorter': dataSorterModules.map((c) => c.id),
  'function-forge': functionForgeModules.map((c) => c.id),
}
