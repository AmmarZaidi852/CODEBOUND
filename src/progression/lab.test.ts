import { describe, expect, it } from 'vitest'
import { tierOf } from '../challenges/meta.ts'
import { arcadeChallenges } from '../content/arcade.ts'
import { gameModules } from '../content/gameChallenges.ts'
import { games, type GameId } from '../content/games.ts'
import {
  allCleared,
  allMastered,
  clearedCounts,
  conceptStatus,
  conceptTargets,
  labAvailable,
  labQueue,
  labRanking,
  needsPracticeCount,
} from './lab.ts'
import {
  applyAnswer,
  newProgress,
  type ChallengeSource,
  type Progress,
} from './progress.ts'
import { loadProgress, saveProgress } from './storage.ts'

/**
 * right: first try · wrong: a miss · fixed: miss, then a clean solve
 * (recovered) · hint-fixed: miss, then solved with a hint (not cleared)
 * · hinted: first try with a hint (not cleared).
 */
type Result = 'right' | 'wrong' | 'fixed' | 'hint-fixed' | 'hinted'

/** Applies results to a progress, e.g. play(p, 'bug-hunt', 'variables', 'fixed'). */
function play(
  p: Progress,
  source: ChallengeSource,
  id: string,
  result: Result = 'right',
): Progress {
  if (result === 'fixed' || result === 'hint-fixed' || result === 'wrong') {
    p = applyAnswer(p, source, id, false).progress
  }
  if (result === 'wrong') return p
  const hint = result === 'hinted' || result === 'hint-fixed'
  return applyAnswer(p, source, id, true, hint).progress
}

/** Every module of the given tiers of one game solved first try. */
function clear(p: Progress, game: GameId, tiers = ['core']) {
  for (const m of gameModules[game]) {
    if (tiers.includes(tierOf(m))) p = play(p, game, m.id)
  }
  return p
}

const allCore = () => games.reduce((p, g) => clear(p, g.id), newProgress())

const ids = (list: { source: string; id: string }[]) =>
  list.map((t) => `${t.source}:${t.id}`)

const rankOf = (p: Progress, key: string) => ids(labRanking(p)).indexOf(key)

describe('Mastery Lab availability', () => {
  it('opens once at least one challenge is solved', () => {
    expect(labAvailable(newProgress())).toBe(false)
    const missed = play(newProgress(), 'bug-hunt', 'variables', 'wrong')
    expect(labAvailable(missed)).toBe(false)
    expect(labAvailable(play(missed, 'bug-hunt', 'variables'))).toBe(true)
  })
})

describe('Mastery Lab priority', () => {
  it('ranks a missed challenge above a merely completed one', () => {
    let p = play(newProgress(), 'bug-hunt', 'arithmetic', 'hint-fixed')
    p = play(p, 'code-breaker', 'basic-if', 'wrong')
    const ranking = labRanking(p)
    expect(ranking[0]).toMatchObject({
      id: 'basic-if',
      priority: 'missed',
    })
    expect(ranking[1]).toMatchObject({
      id: 'arithmetic',
      priority: 'not-mastered',
    })
  })

  it('a hinted solve counts as not mastered', () => {
    const p = play(newProgress(), 'data-sorter', 'lists', 'hinted')
    expect(labQueue(p)[0]).toMatchObject({
      id: 'lists',
      priority: 'not-mastered',
    })
  })

  it('orders core, then advanced, then boss practice, then new challenges', () => {
    let p = clear(newProgress(), 'bug-hunt', ['core'])
    p = play(p, 'bug-hunt', 'member-discount', 'hint-fixed')
    p = play(p, 'bug-hunt', 'average-score', 'right')
    p = play(p, 'bug-hunt', 'shop-checkout', 'hint-fixed')
    p = play(p, 'code-breaker', 'basic-if', 'hint-fixed')
    const queue = labQueue(p)
    expect(queue.slice(0, 4).map((t) => [t.id, t.priority])).toEqual([
      ['basic-if', 'not-mastered'],
      ['member-discount', 'advanced'],
      ['shop-checkout', 'boss'],
      ['comparisons', 'new'],
    ])
  })

  it('puts mastered challenges last, and keeps them out of the queue', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables', 'right')
    p = play(p, 'bug-hunt', 'arithmetic', 'hint-fixed')
    const ranking = labRanking(p)
    expect(ranking.at(-1)).toMatchObject({
      id: 'variables',
      priority: 'mastered',
    })
    expect(rankOf(p, 'bug-hunt:arithmetic')).toBe(0)
    expect(ids(labQueue(p))).not.toContain('bug-hunt:variables')
  })

  it('mixes games among new challenges instead of draining one game', () => {
    const p = play(newProgress(), 'bug-hunt', 'variables')
    expect(ids(labQueue(p, 4))).toEqual([
      'bug-hunt:arithmetic',
      'code-breaker:basic-if',
      'data-sorter:lists',
      'function-forge:define',
    ])
  })

  it('is deterministic, also after a reload', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables', 'hint-fixed')
    p = play(p, 'data-sorter', 'pop', 'wrong')
    p = play(p, 'function-forge', 'define', 'hinted')
    expect(labRanking(p)).toEqual(labRanking(p))
    saveProgress(p)
    expect(ids(labRanking(loadProgress()))).toEqual(ids(labRanking(p)))
  })

  it('shows at most five targets', () => {
    expect(labQueue(play(newProgress(), 'bug-hunt', 'variables'))).toHaveLength(
      5,
    )
  })

  it('counts modules needing practice (answered, not cleared)', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables', 'hint-fixed')
    p = play(p, 'bug-hunt', 'arithmetic', 'wrong')
    p = play(p, 'bug-hunt', 'strings', 'right')
    expect(needsPracticeCount(p)).toBe(2)
  })
})

describe('Mastery Lab never shows locked or unreleased modules', () => {
  const tiersIn = (p: Progress, game: GameId) =>
    labRanking(p)
      .filter((t) => t.source === game)
      .map((t) => t.tier)

  it('a new player sees core modules only, and no Arcade modules', () => {
    const ranking = labRanking(play(newProgress(), 'bug-hunt', 'variables'))
    expect(new Set(ranking.map((t) => t.tier))).toEqual(new Set(['core']))
    expect(ranking.some((t) => t.source === 'arcade')).toBe(false)
  })

  it('advanced opens with its game core, the boss once it is ready', () => {
    let p = clear(newProgress(), 'bug-hunt', ['core'])
    expect(tiersIn(p, 'bug-hunt')).toContain('advanced')
    expect(tiersIn(p, 'bug-hunt')).not.toContain('boss')
    expect(tiersIn(p, 'code-breaker')).not.toContain('advanced')
    p = clear(p, 'bug-hunt', ['advanced'])
    expect(tiersIn(p, 'bug-hunt')).toContain('boss')
  })

  it('arcade-only modules appear once the Arcade unlocks', () => {
    const p = allCore()
    expect(ids(labQueue(p, 50))).toEqual(
      expect.arrayContaining(['arcade:delivery-gate', 'arcade:shield-breach']),
    )
  })

  it('only lists released modules from the games and the Arcade', () => {
    const released = new Set([
      ...Object.entries(gameModules).flatMap(([g, ms]) =>
        ms.map((m) => `${g}:${m.id}`),
      ),
      ...arcadeChallenges.map((c) => `arcade:${c.id}`),
    ])
    let p = allCore()
    for (const g of games) p = clear(p, g.id, ['advanced'])
    const all = ids(labRanking(p))
    expect(all.length).toBe(released.size)
    for (const key of all) expect(released.has(key)).toBe(true)
  })
})

describe('Mastery Lab completion and concepts', () => {
  /** Every released module mastered. */
  function everything() {
    let p = newProgress()
    for (const g of games) {
      p = clear(p, g.id, ['core', 'advanced', 'boss'])
    }
    for (const c of arcadeChallenges) p = play(p, 'arcade', c.id)
    return p
  }

  it('recognises when every current module is mastered', () => {
    expect(allMastered(allCore())).toBe(false)
    const p = everything()
    expect(allMastered(p)).toBe(true)
    expect(labQueue(p)).toEqual([])
    expect(needsPracticeCount(p)).toBe(0)
  })

  it('a wrong replay keeps mastery; a module fixed after a miss is not mastered', () => {
    const p = play(everything(), 'bug-hunt', 'variables', 'wrong')
    // A wrong replay never removes mastery.
    expect(allMastered(p)).toBe(true)
    const q = play(newProgress(), 'bug-hunt', 'variables', 'fixed')
    expect(allMastered(q)).toBe(false)
  })

  it('derives each concept from the modules that use it', () => {
    const fresh = conceptStatus(newProgress())
    expect(fresh.map((c) => c.label)).toEqual(Array(8).fill('new'))
    const lists = fresh.find((c) => c.id === 'lists')!
    expect(lists.mastered).toBe(0)
    expect(lists.total).toBeGreaterThan(5)

    const p = play(newProgress(), 'data-sorter', 'lists', 'fixed')
    const status = conceptStatus(p)
    expect(status.find((c) => c.id === 'lists')).toMatchObject({
      label: 'practice',
      mastered: 0,
    })
    expect(
      conceptStatus(everything()).every((c) => c.label === 'mastered'),
    ).toBe(true)
  })

  it('reports whether the Foundations lesson is complete', () => {
    const p = { ...newProgress(), concepts: ['indexing' as const] }
    expect(conceptStatus(p).find((c) => c.id === 'indexing')?.learned).toBe(
      true,
    )
  })

  it('maps a concept to the recommended modules that use it', () => {
    let p = play(newProgress(), 'data-sorter', 'indexing', 'hint-fixed')
    p = play(p, 'bug-hunt', 'variables', 'hint-fixed')
    const targets = conceptTargets(p, 'indexing')
    expect(targets.length).toBeLessThanOrEqual(3)
    expect(targets[0]).toMatchObject({ id: 'indexing', source: 'data-sorter' })
    for (const t of targets) expect(t.module.concepts).toContain('indexing')
  })
})

describe('Mastery Lab and recovery', () => {
  it('a recovered module leaves the queue and ranks after new, before mastered', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables', 'right')
    p = play(p, 'bug-hunt', 'arithmetic', 'wrong')
    expect(labQueue(p)[0]).toMatchObject({
      id: 'arithmetic',
      priority: 'missed',
    })
    p = play(p, 'bug-hunt', 'arithmetic', 'right')
    expect(ids(labQueue(p, 50))).not.toContain('bug-hunt:arithmetic')
    const ranking = labRanking(p).map((t) => t.priority)
    expect(ranking.slice(-2)).toEqual(['recovered', 'mastered'])
    expect(ranking.indexOf('new')).toBeLessThan(ranking.indexOf('recovered'))
    expect(needsPracticeCount(p)).toBe(0)
  })

  it('an unresolved module still ranks above recovered ones', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables', 'fixed')
    p = play(p, 'code-breaker', 'basic-if', 'wrong')
    p = play(p, 'data-sorter', 'lists', 'hint-fixed')
    expect(
      labQueue(p)
        .slice(0, 2)
        .map((t) => [t.id, t.priority]),
    ).toEqual([
      ['basic-if', 'missed'],
      ['lists', 'not-mastered'],
    ])
    expect(needsPracticeCount(p)).toBe(2)
  })

  it('stays recovered after a reload, with the same queue', () => {
    const p = play(newProgress(), 'bug-hunt', 'variables', 'fixed')
    saveProgress(p)
    const loaded = loadProgress()
    expect(labRanking(loaded).find((t) => t.id === 'variables')?.priority).toBe(
      'recovered',
    )
    expect(ids(labQueue(loaded))).toEqual(ids(labQueue(p)))
  })

  it('counts concepts as mastered, recovered and still to clear', () => {
    let p = play(newProgress(), 'data-sorter', 'indexing', 'right')
    p = play(p, 'data-sorter', 'set-item', 'fixed')
    p = play(p, 'data-sorter', 'pop', 'wrong')
    const indexing = conceptStatus(p).find((c) => c.id === 'indexing')!
    expect(indexing).toMatchObject({
      mastered: 1,
      recovered: 1,
      label: 'practice',
    })
    expect(indexing.states.slice(0, 3)).toEqual([
      'mastered',
      'recovered',
      'unplayed',
    ])
  })

  it('a concept with everything mastered or recovered reads Recovered', () => {
    let p = newProgress()
    for (const g of games) {
      for (const m of gameModules[g.id]) {
        if (m.concepts.includes('indexing')) {
          p = play(p, g.id, m.id, m.id === 'pop' ? 'fixed' : 'right')
        }
      }
    }
    for (const c of arcadeChallenges) {
      if (c.concepts.includes('indexing')) p = play(p, 'arcade', c.id)
    }
    expect(conceptStatus(p).find((c) => c.id === 'indexing')?.label).toBe(
      'recovered',
    )
  })

  it('all cleared and all first-try mastered are different claims', () => {
    let p = newProgress()
    for (const g of games) {
      for (const m of gameModules[g.id]) {
        p = play(p, g.id, m.id, m.id === 'variables' ? 'fixed' : 'right')
      }
    }
    for (const c of arcadeChallenges) p = play(p, 'arcade', c.id)
    expect(allCleared(p)).toBe(true)
    expect(allMastered(p)).toBe(false)
    expect(labQueue(p)).toEqual([])
    expect(clearedCounts(p)).toMatchObject({ recovered: 1 })
    expect(clearedCounts(p).mastered).toBe(clearedCounts(p).total - 1)
  })

  it('a hinted solve is not cleared until a clean solve recovers it', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables', 'hinted')
    expect(labQueue(p)[0]).toMatchObject({
      id: 'variables',
      priority: 'not-mastered',
    })
    p = play(p, 'bug-hunt', 'variables', 'right')
    expect(ids(labQueue(p, 50))).not.toContain('bug-hunt:variables')
  })
})
