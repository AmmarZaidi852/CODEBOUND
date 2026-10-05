import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import type { ConceptId } from './challenges/foundations.ts'
import { interactionOf, type GameModule } from './challenges/interaction.ts'
import { tierOf, type Tier } from './challenges/meta.ts'
import { foundations } from './content/foundations.ts'
import {
  bugHuntModules,
  codeBreakerModules,
  dataSorterModules,
  functionForgeModules,
} from './content/gameChallenges.ts'
import type { GameId } from './content/games.ts'
import {
  applyAnswer,
  bossState,
  challengeKey,
  gameStates,
  newProgress,
  sectionOf,
  tierCounts,
  type Progress,
} from './progression/progress.ts'
import { loadProgress, saveProgress } from './progression/storage.ts'
import { answerBugHunt, nextModule } from './test/play.ts'
import { expectStep } from './test/progress.ts'
import { expectTotalXp } from './test/render.tsx'

const games: [GameId, readonly GameModule[]][] = [
  ['bug-hunt', bugHuntModules],
  ['code-breaker', codeBreakerModules],
  ['data-sorter', dataSorterModules],
  ['function-forge', functionForgeModules],
]

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

type Result = 'right' | 'wrong' | 'fixed' | 'hinted'

/** Saved Bug Hunt progress from per-module results (missing = unplayed). */
function savedBugHunt(results: Partial<Record<number, Result>>): Progress {
  let p = newProgress()
  for (const [at, r] of Object.entries(results)) {
    const id = bugHuntModules[Number(at)].id
    if (r === 'fixed') {
      // A miss first, then the correct answer later.
      p = applyAnswer(p, 'bug-hunt', id, false).progress
    }
    p = applyAnswer(p, 'bug-hunt', id, r !== 'wrong', r === 'hinted').progress
  }
  return p
}

const tiers = bugHuntModules.map(tierOf)
const CORE = tiers.flatMap((t, i) => (t === 'core' ? [i] : []))
const ADVANCED = tiers.flatMap((t, i) => (t === 'advanced' ? [i] : []))
const BOSS = tiers.indexOf('boss')
const all = (indexes: number[], r: Result = 'right') =>
  Object.fromEntries(indexes.map((i) => [i, r]))

describe('difficulty metadata', () => {
  // Phase 9 added two ADVANCED modules per game; Phase 13 added 2 / 2 / 3 / 3.
  const advancedCount: Record<GameId, number> = {
    'bug-hunt': 4,
    'code-breaker': 4,
    'data-sorter': 5,
    'function-forge': 5,
  }

  it.each(games)('%s: CORE, then ADVANCED, then one BOSS', (game, modules) => {
    const order = modules.map(tierOf)
    const rank: Record<Tier, number> = { core: 0, advanced: 1, boss: 2 }
    expect(order).toEqual([...order].sort((a, b) => rank[a] - rank[b]))
    expect(order.filter((t) => t === 'advanced')).toHaveLength(
      advancedCount[game],
    )
    expect(order.filter((t) => t === 'boss')).toHaveLength(1)
    expect(order.at(-1)).toBe('boss')
  })

  it.each(games)('%s: harder tiers combine more concepts', (_, modules) => {
    for (const m of modules) {
      const min = { core: 1, advanced: 2, boss: 3 }[tierOf(m)]
      expect(m.concepts.length, m.id).toBeGreaterThanOrEqual(min)
    }
  })

  it.each(games)(
    '%s: advanced and boss modules only use concepts already taught',
    (game, modules) => {
      const order = foundations.map((c) => c.id)
      const linked = foundations.filter((c) => c.game === game).map((c) => c.id)
      const lastLinked = Math.max(...linked.map((id) => order.indexOf(id)))
      const taught = new Set<ConceptId>([
        ...order.slice(0, lastLinked + 1),
        ...modules
          .filter((m) => tierOf(m) === 'core')
          .flatMap((m) => m.concepts),
      ])
      for (const m of modules.filter((m) => tierOf(m) !== 'core')) {
        for (const c of m.concepts)
          expect(taught.has(c), `${m.id}: ${c}`).toBe(true)
      }
    },
  )

  it('mixes interaction types in the advanced modules, and every boss is written code', () => {
    const advanced = games.flatMap(([, ms]) =>
      ms.filter((m) => tierOf(m) === 'advanced'),
    )
    expect(new Set(advanced.map(interactionOf))).toEqual(
      new Set(['choose', 'predict', 'build', 'write']),
    )
    for (const [, ms] of games) {
      const boss = ms.find((m) => tierOf(m) === 'boss')!
      expect(interactionOf(boss)).toBe('write')
    }
  })
})

describe('tier progress rules', () => {
  const states = (p: Progress) =>
    gameStates(
      p,
      'bug-hunt',
      bugHuntModules.map((m) => m.id),
    )

  it('counts each tier and finds sections', () => {
    const p = savedBugHunt({ ...all(CORE), [ADVANCED[0]]: 'right' })
    expect(tierCounts(states(p), tiers, 'core')).toEqual({ done: 7, total: 7 })
    expect(tierCounts(states(p), tiers, 'advanced')).toEqual({
      done: 1,
      total: 4,
    })
    expect(sectionOf(tiers, 0)).toEqual({
      tier: 'core',
      start: 0,
      end: CORE.at(-1),
    })
    expect(sectionOf(tiers, ADVANCED[1])).toEqual({
      tier: 'advanced',
      start: ADVANCED[0],
      end: ADVANCED.at(-1),
    })
  })

  it('locks the boss until every core and advanced module is complete', () => {
    expect(bossState(states(newProgress()), tiers)).toBe('locked')
    expect(bossState(states(savedBugHunt(all(CORE))), tiers)).toBe('locked')
    // A missed advanced module keeps it locked.
    const missed = savedBugHunt({
      ...all(CORE),
      [ADVANCED[0]]: 'right',
      [ADVANCED[1]]: 'wrong',
    })
    expect(bossState(states(missed), tiers)).toBe('locked')
    const ready = savedBugHunt({ ...all(CORE), ...all(ADVANCED) })
    expect(bossState(states(ready), tiers)).toBe('ready')
  })

  it('a first-try boss is mastered; a missed or hinted boss is only cleared', () => {
    const before = { ...all(CORE), ...all(ADVANCED) }
    expect(
      bossState(states(savedBugHunt({ ...before, [BOSS]: 'right' })), tiers),
    ).toBe('mastered')
    expect(
      bossState(states(savedBugHunt({ ...before, [BOSS]: 'fixed' })), tiers),
    ).toBe('cleared')
    expect(
      bossState(states(savedBugHunt({ ...before, [BOSS]: 'hinted' })), tiers),
    ).toBe('cleared')
  })

  it('a boss follows the same XP rules: 100 first try, 25 then 75, 0 after', () => {
    const id = bugHuntModules[BOSS].id
    let p = newProgress()
    const miss = applyAnswer(p, 'bug-hunt', id, false)
    expect(miss.outcome.xpEarned).toBe(25)
    const fix = applyAnswer(miss.progress, 'bug-hunt', id, true)
    expect(fix.outcome.xpEarned).toBe(75)
    expect(
      applyAnswer(fix.progress, 'bug-hunt', id, true).outcome.xpEarned,
    ).toBe(0)
    p = applyAnswer(newProgress(), 'bug-hunt', id, true).progress
    expect(p.xp).toBe(100)
    // A wrong replay never removes mastery.
    const replay = applyAnswer(p, 'bug-hunt', id, false)
    expect(replay.outcome.xpEarned).toBe(0)
    expect(
      replay.progress.challenges[challengeKey('bug-hunt', id)].mastered,
    ).toBe(true)
  })
})

describe('playing through the tiers', () => {
  function openBugHunt(progress: Progress, button: string) {
    saveProgress(progress)
    render(<App />)
    click('PLAY')
    click(button)
  }

  it('a core run ends at the last core module and opens Advanced next', () => {
    render(<App />)
    click('PLAY')
    click('Play Bug Hunt')
    CORE.forEach((i) => {
      answerBugHunt(bugHuntModules[i], true)
      nextModule(i === CORE.at(-1))
    })
    expect(screen.getByText('Bug Hunt · Core complete')).toBeInTheDocument()
    click('Play Advanced')
    expectStep('Bug Hunt', ADVANCED[0] + 1, bugHuntModules.length)
    expect(
      screen.getByText('Advanced', { selector: '.tier-tag' }),
    ).toBeInTheDocument()
  })

  it('Continue recommends unfinished core first, then advanced, then the boss', () => {
    openBugHunt(
      savedBugHunt({ 0: 'right', 1: 'wrong', 2: 'right' }),
      'Continue Bug Hunt',
    )
    expectStep('Bug Hunt', 2, 12)
  })

  it('Continue opens Advanced once core is complete', () => {
    openBugHunt(savedBugHunt(all(CORE)), 'Continue Bug Hunt')
    expectStep('Bug Hunt', ADVANCED[0] + 1, 12)
  })

  it('Continue opens the boss once it is ready, framed as a boss module', () => {
    openBugHunt(
      savedBugHunt({ ...all(CORE), ...all(ADVANCED) }),
      'Continue Bug Hunt',
    )
    expectStep('Bug Hunt', BOSS + 1, 12)
    expect(
      screen.getByText('Boss module', { selector: '.tier-tag' }),
    ).toBeInTheDocument()
    expect(screen.getByText('System critical · Final test')).toBeInTheDocument()
  })

  it('an unfinished advanced module keeps the boss locked after the run', () => {
    openBugHunt(savedBugHunt(all(CORE)), 'Continue Bug Hunt')
    answerBugHunt(bugHuntModules[ADVANCED[0]], false)
    nextModule(false)
    ADVANCED.slice(1).forEach((i) => {
      answerBugHunt(bugHuntModules[i], true)
      nextModule(i === ADVANCED.at(-1))
    })
    expect(screen.getByText('1 module left to complete.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Play Boss' })).toBeNull()
    click('Retry unfinished')
    expectStep('Bug Hunt', ADVANCED[0] + 1, 12)
  })

  it('clearing the boss completes the game; replay starts again at module 01', () => {
    openBugHunt(
      savedBugHunt({ ...all(CORE), ...all(ADVANCED) }),
      'Continue Bug Hunt',
    )
    answerBugHunt(bugHuntModules[BOSS], true)
    expect(
      screen.getByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeInTheDocument()
    expectTotalXp(bugHuntModules.length * 100)
    nextModule(true)
    expect(screen.getByText('Bug Hunt · Game mastered')).toBeInTheDocument()
    click('Back to games')
    const card = screen
      .getByRole('heading', { name: 'Bug Hunt' })
      .closest('li')!
    expect(within(card).getByText('Boss Mastered')).toBeInTheDocument()
    click('Replay Bug Hunt')
    expectStep('Bug Hunt', 1, 12)
  })

  it('stamps a boss cleared after a miss, and keeps it after a reload', () => {
    saveProgress(savedBugHunt({ ...all(CORE), ...all(ADVANCED) }))
    const { unmount } = render(<App />)
    click('PLAY')
    click('Continue Bug Hunt')
    answerBugHunt(bugHuntModules[BOSS], false)
    click('Try again')
    answerBugHunt(bugHuntModules[BOSS], true)
    nextModule(true)
    expect(screen.getByText('Bug Hunt · Boss cleared')).toBeInTheDocument()
    expect(
      loadProgress().challenges[
        challengeKey('bug-hunt', bugHuntModules[BOSS].id)
      ],
    ).toEqual({
      solved: true,
      mastered: false,
      recovered: true,
      xp: 100,
    })
    unmount()
    render(<App />)
    click('PLAY')
    const card = screen
      .getByRole('heading', { name: 'Bug Hunt' })
      .closest('li')!
    expect(within(card).getByText('Boss Cleared')).toBeInTheDocument()
    expect(within(card).getByText('Complete')).toBeInTheDocument()
  })

  it('shows the boss as ready on the cartridge once it unlocks', () => {
    saveProgress(savedBugHunt({ ...all(CORE), ...all(ADVANCED) }))
    render(<App />)
    click('PLAY')
    const card = screen
      .getByRole('heading', { name: 'Bug Hunt' })
      .closest('li')!
    expect(within(card).getByText('Core 07/07')).toBeInTheDocument()
    expect(within(card).getByText('Advanced 04/04')).toBeInTheDocument()
    expect(within(card).getByText('Boss Ready')).toBeInTheDocument()
  })
})
