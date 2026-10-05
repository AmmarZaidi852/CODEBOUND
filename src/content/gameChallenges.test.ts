import { describe, expect, it } from 'vitest'
import type { CodeChallenge } from '../challenges/code.ts'
import { tierOf } from '../challenges/meta.ts'
import {
  bugHuntModules,
  codeBreakerModules,
  dataSorterModules,
  functionForgeModules,
  gameChallengeIds,
} from './gameChallenges.ts'

describe('game module lists', () => {
  it('places write modules inside the existing games without duplicates', () => {
    for (const modules of [
      bugHuntModules,
      codeBreakerModules,
      dataSorterModules,
      functionForgeModules,
    ]) {
      const ids = modules.map((m) => m.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    const writes = (list: object[]) =>
      list.filter((m) => (m as CodeChallenge).kind === 'code').length
    // CORE write modules (Phase 8), ADVANCED / BOSS ones (Phase 9), and
    // Score Bonus and Power Limiter (Phase 13), Stuck Loop (Phase 15).
    expect(writes(bugHuntModules)).toBe(5)
    expect(writes(codeBreakerModules)).toBe(5)
    expect(writes(dataSorterModules)).toBe(4)
    expect(writes(functionForgeModules)).toBe(6)
  })

  it('keeps every existing challenge, in its original order', async () => {
    const lists = await Promise.all([
      import('./bugHuntChallenges.ts').then((m) => m.bugHuntChallenges),
      import('./codeBreakerChallenges.ts').then((m) => m.codeBreakerChallenges),
      import('./dataSorterChallenges.ts').then((m) => m.dataSorterChallenges),
      import('./functionForgeChallenges.ts').then(
        (m) => m.functionForgeChallenges,
      ),
    ])
    const modules = [
      bugHuntModules,
      codeBreakerModules,
      dataSorterModules,
      functionForgeModules,
    ]
    lists.forEach((original, i) => {
      const kept = modules[i].filter(
        (m) => (m as CodeChallenge).kind !== 'code' && tierOf(m) === 'core',
      )
      expect(kept).toEqual(original)
    })
  })

  it('reads saved progress by every module id', () => {
    expect(gameChallengeIds['bug-hunt']).toEqual(
      bugHuntModules.map((m) => m.id),
    )
    expect(gameChallengeIds['function-forge']).toHaveLength(16)
  })
})
