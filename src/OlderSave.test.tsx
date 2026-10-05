import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { tierOf } from './challenges/meta.ts'
import { arcadeChallenges } from './content/arcade.ts'
import { bugHuntModules, gameModules } from './content/gameChallenges.ts'
import type { GameId } from './content/games.ts'
import { workshopModules } from './content/workshopChallenges.ts'
import { arcadeStatus } from './progression/arcade.ts'
import {
  allCleared,
  labRanking,
  needsPracticeCount,
} from './progression/lab.ts'
import {
  applyAnswer,
  bossState,
  continueIndex,
  gameStates,
  gameStatus,
  newProgress,
  tierCounts,
  type Progress,
} from './progression/progress.ts'
import { loadProgress, saveProgress } from './progression/storage.ts'
import { answerBugHunt, nextModule } from './test/play.ts'
import { expectStep } from './test/progress.ts'
import { expectTotalXp } from './test/render.tsx'

/*
 * Saves from before Phase 13: every module that existed then is cleared,
 * and the ten workshop modules appended to the Advanced tiers are not
 * in the save at all.
 */

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

const gameIds = Object.keys(gameModules) as GameId[]
const workshopIds = new Set(workshopModules.map((m) => m.id))
const isOld = (m: { id: string }) => !workshopIds.has(m.id)

/** All pre-Phase 13 modules first try; each boss mastered or (after a miss) cleared. */
function olderSave(boss: 'mastered' | 'cleared' = 'mastered'): Progress {
  let p = newProgress()
  for (const game of gameIds) {
    for (const m of gameModules[game].filter(isOld)) {
      if (boss === 'cleared' && tierOf(m) === 'boss') {
        p = applyAnswer(p, game, m.id, false).progress
      }
      p = applyAnswer(p, game, m.id, true).progress
    }
  }
  for (const m of arcadeChallenges) {
    p = applyAnswer(p, 'arcade', m.id, true).progress
  }
  return p
}

const oldModuleCount =
  gameIds.reduce((n, g) => n + gameModules[g].filter(isOld).length, 0) +
  arcadeChallenges.length

const statesOf = (p: Progress, game: GameId) =>
  gameStates(
    p,
    game,
    gameModules[game].map((m) => m.id),
  )

const firstNew = (game: GameId) =>
  gameModules[game].findIndex((m) => workshopIds.has(m.id))

describe('a save from before Phase 13', () => {
  it.each(gameIds)(
    '%s: back to In progress, boss kept, Continue at the first new module',
    (game) => {
      for (const boss of ['mastered', 'cleared'] as const) {
        const states = statesOf(olderSave(boss), game)
        const tiers = gameModules[game].map(tierOf)
        expect(gameStatus(states)).toBe('in-progress')
        expect(bossState(states, tiers)).toBe(boss)
        expect(continueIndex(states)).toBe(firstNew(game))
        expect(tierOf(gameModules[game][firstNew(game)])).toBe('advanced')
        const newCount = gameModules[game].filter((m) => !isOld(m)).length
        const advanced = tierCounts(states, tiers, 'advanced')
        expect(advanced.total - advanced.done).toBe(newCount)
        expect(tierCounts(states, tiers, 'core').done).toBe(
          tierCounts(states, tiers, 'core').total,
        )
      }
    },
  )

  it('loads with its XP and every record unchanged', () => {
    const before = olderSave('cleared')
    saveProgress(before)
    const after = loadProgress()
    expect(after.xp).toBe(oldModuleCount * 100)
    expect(after.challenges).toEqual(before.challenges)
  })

  it('shows the new Advanced modules on the cartridge and keeps the boss', () => {
    saveProgress(olderSave())
    render(<App />)
    expectTotalXp(oldModuleCount * 100)
    click('PLAY')
    const card = screen
      .getByRole('heading', { name: 'Bug Hunt' })
      .closest('li')!
    expect(within(card).getByText('In progress')).toBeInTheDocument()
    expect(within(card).getByText('Core 07/07')).toBeInTheDocument()
    expect(within(card).getByText('Advanced 02/04')).toBeInTheDocument()
    expect(within(card).getByText('Boss Mastered')).toBeInTheDocument()
  })

  it.each(['mastered', 'cleared'] as const)(
    'boss %s: Continue plays the new modules for full XP, then offers Replay Boss',
    (boss) => {
      saveProgress(olderSave(boss))
      render(<App />)
      click('PLAY')
      click('Continue Bug Hunt')
      const start = firstNew('bug-hunt')
      expectStep('Bug Hunt', start + 1, bugHuntModules.length)
      const added = bugHuntModules.filter((m) => !isOld(m))
      added.forEach((m, i) => {
        answerBugHunt(m, true)
        expect(screen.getByText('+100 XP')).toBeInTheDocument()
        nextModule(i === added.length - 1)
      })
      expectTotalXp((oldModuleCount + added.length) * 100)
      expect(
        screen.getByText(`Boss already ${boss}: replay it any time.`),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Play Boss' })).toBeNull()
      expect(screen.queryByText(/Boss module ready/)).toBeNull()

      click('Replay Boss')
      expectStep('Bug Hunt', bugHuntModules.length, bugHuntModules.length)
      expect(
        bossState(
          statesOf(loadProgress(), 'bug-hunt'),
          bugHuntModules.map(tierOf),
        ),
      ).toBe(boss)
    },
  )

  it('the Lab queues the new modules as new challenges, never as needing practice', () => {
    const p = olderSave()
    const fresh = labRanking(p).filter((t) => t.priority === 'new')
    expect(new Set(fresh.map((t) => t.id))).toEqual(workshopIds)
    expect(needsPracticeCount(p)).toBe(0)
    expect(allCleared(p)).toBe(false)

    saveProgress(p)
    render(<App />)
    expect(screen.getByText('Practise your next targets')).toBeInTheDocument()
    expect(screen.queryByText(/All current modules/)).toBeNull()
    click('Open Lab')
    const first = screen.getAllByRole('listitem')[0]
    expect(within(first).getByText('New challenge')).toBeInTheDocument()
  })

  it('the Lab says all cleared again once the new modules are cleared', () => {
    let p = olderSave('cleared')
    for (const game of gameIds) {
      for (const m of gameModules[game].filter((m) => !isOld(m))) {
        p = applyAnswer(p, game, m.id, true).progress
      }
    }
    expect(allCleared(p)).toBe(true)
    saveProgress(p)
    render(<App />)
    expect(screen.getByText('All current modules cleared')).toBeInTheDocument()
  })

  it('keeps the Arcade unlocked (it only needs the Core tiers)', () => {
    const p = olderSave()
    expect(arcadeStatus(p)).toBe('new')
    saveProgress(p)
    render(<App />)
    expect(screen.getByText('Arcade ready · 8 module run')).toBeInTheDocument()
  })
})
