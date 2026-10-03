import { bugHuntChallenges } from './bugHuntChallenges.ts'
import { codeBreakerChallenges } from './codeBreakerChallenges.ts'
import { dataSorterChallenges } from './dataSorterChallenges.ts'
import { functionForgeChallenges } from './functionForgeChallenges.ts'
import type { GameId } from './games.ts'

/** Every game's challenge ids, in play order. Used to read saved progress. */
export const gameChallengeIds: Record<GameId, readonly string[]> = {
  'bug-hunt': bugHuntChallenges.map((c) => c.id),
  'code-breaker': codeBreakerChallenges.map((c) => c.id),
  'data-sorter': dataSorterChallenges.map((c) => c.id),
  'function-forge': functionForgeChallenges.map((c) => c.id),
}
