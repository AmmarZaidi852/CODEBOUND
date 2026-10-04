import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { arcadeModules } from './content/arcade.ts'
import { gameChallengeIds, gameModuleTiers } from './content/gameChallenges.ts'
import { games } from './content/games.ts'
import {
  applyAnswer,
  challengeKey,
  newProgress,
  type Progress,
} from './progression/progress.ts'
import {
  loadProgress,
  saveProgress,
  STORAGE_KEY,
} from './progression/storage.ts'
import { answerModule, nextModule } from './test/play.ts'
import { expectStep } from './test/progress.ts'
import { expectStat, expectTotalXp } from './test/render.tsx'

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

const TOTAL = arcadeModules.length
const LAST = TOTAL - 1

/** Every CORE module of all four games solved on the first try. */
function coreDone(): Progress {
  let p = newProgress()
  for (const { id: game } of games) {
    gameChallengeIds[game].forEach((id, i) => {
      if (gameModuleTiers[game][i] === 'core') {
        p = applyAnswer(p, game, id, true).progress
      }
    })
  }
  return p
}
const CORE_XP = coreDone().xp

const card = () =>
  within(screen.getByRole('region', { name: 'Codebound Arcade' }))

/** Opens game selection from Home. */
function openGames(progress?: Progress) {
  if (progress) saveProgress(progress)
  const view = render(<App />)
  click('PLAY')
  return view
}

/** Plays module `i` and moves on (Show solution first after a write miss). */
function play(i: number, correct = true) {
  answerModule(arcadeModules[i].module, correct)
  nextModule(i === LAST)
}

function playAll(correct: (i: number) => boolean = () => true) {
  for (let i = 0; i < TOTAL; i++) play(i, correct(i))
}

const saved = (i: number) => {
  const { source, id } = arcadeModules[i]
  return loadProgress().challenges[challengeKey(source, id)]
}

describe('Arcade unlock', () => {
  it('is locked for a new player, with the reason, and stays off Home', () => {
    render(<App />)
    expect(screen.queryByText(/Arcade ready/)).toBeNull()
    click('PLAY')
    expect(card().getByText('Arcade locked')).toBeInTheDocument()
    expect(
      card().getByText('Complete the Core modules in all four games.'),
    ).toBeInTheDocument()
    expect(card().getByText('Core 0/4 games')).toBeInTheDocument()
    expect(card().queryByRole('button')).toBeNull()
  })

  it('stays locked with three of four core tiers complete', () => {
    const p = coreDone()
    const without = Object.fromEntries(
      Object.entries(p.challenges).filter(
        ([k]) => k !== challengeKey('data-sorter', 'lists'),
      ),
    )
    openGames({ ...p, challenges: without })
    expect(card().getByText('Arcade locked')).toBeInTheDocument()
    expect(card().getByText('Core 3/4 games')).toBeInTheDocument()
  })

  it('unlocks after every core module, and stays unlocked after a reload', () => {
    saveProgress(coreDone())
    const { unmount } = render(<App />)
    expect(screen.getByText('Arcade ready · 8 module run')).toBeInTheDocument()
    click('PLAY')
    expect(card().getByText('Arcade ready')).toBeInTheDocument()
    expect(
      card().getByRole('button', { name: 'Play Arcade Run' }),
    ).toBeInTheDocument()
    unmount()
    openGames()
    expect(card().getByText('Arcade ready')).toBeInTheDocument()
  })
})

describe('Arcade run progression', () => {
  it('a new run starts at module 1 under the Arcade HUD', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    expectStep('Arcade Run', 1, TOTAL)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Average Disaster' }),
    ).toBeInTheDocument()
  })

  it('Continue resumes the right module after leaving and after a reload', () => {
    const { unmount } = openGames(coreDone())
    click('Play Arcade Run')
    play(0)
    play(1)
    click('← Games')
    expect(card().getByText('In progress')).toBeInTheDocument()
    expect(card().getByText('Module 03 / 08')).toBeInTheDocument()
    unmount()

    render(<App />)
    expect(
      screen.getByText('Arcade run in progress · module 3 of 8'),
    ).toBeInTheDocument()
    click('PLAY')
    click('Continue Arcade')
    expectStep('Arcade Run', 3, TOTAL)
  })

  it('an answered module is kept even if the player leaves before Next', () => {
    const { unmount } = openGames(coreDone())
    click('Play Arcade Run')
    answerModule(arcadeModules[0].module, true)
    unmount()
    openGames()
    click('Continue Arcade')
    expectStep('Arcade Run', 2, TOTAL)
  })

  it('a missed write module resumes at that module, ready to retry', () => {
    const { unmount } = openGames(coreDone())
    click('Play Arcade Run')
    play(0)
    answerModule(arcadeModules[1].module, false)
    expect(screen.getByText(/Want a refresher\?/)).toBeInTheDocument()
    unmount()
    openGames()
    click('Continue Arcade')
    expectStep('Arcade Run', 2, TOTAL)
    expect(screen.getByRole('button', { name: 'Check code' })).toBeDisabled()
  })

  it('Replay during a run starts again at module 1', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    play(0)
    play(1)
    click('← Games')
    click('Replay Arcade Run from the start')
    expectStep('Arcade Run', 1, TOTAL)
  })

  it('the last module is framed as the Final Run, not a boss', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    for (let i = 0; i < LAST; i++) play(i)
    expectStep('Arcade Run', TOTAL, TOTAL)
    expect(screen.getByText('Final run')).toBeInTheDocument()
    expect(
      screen.getByText('Arcade final · Every system at once'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/boss/i)).toBeNull()
  })

  it('a finished run shows the summary and persists as complete', () => {
    const { unmount } = openGames(coreDone())
    click('Play Arcade Run')
    playAll()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Run complete' }),
    ).toBeInTheDocument()
    expectStat('Correct', '8/8')
    expectStat('First try', '8/8')
    expectStat('Accuracy', '100%')
    expect(
      screen.getByText(
        'Variables · Data types · Operators · Conditions · Lists · Indexing · Loops · Functions',
      ),
    ).toBeInTheDocument()
    unmount()
    openGames()
    expect(card().getByText('Complete')).toBeInTheDocument()
    expect(card().getByText('1 run finished')).toBeInTheDocument()
    expect(card().getByRole('button', { name: 'Replay Arcade' })).toBeEnabled()
  })

  it('Replay run from the summary starts a new run at module 1', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    playAll()
    click('Replay run')
    expectStep('Arcade Run', 1, TOTAL)
  })
})

describe('Arcade challenge integration', () => {
  it('plays each module with its own game round and validation', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    // Bug Hunt's patch list, Data Sorter's cells, Function Forge's run.
    expect(
      screen.getByRole('group', {
        name: 'Choose the patch that fixes the bug',
      }),
    ).toBeInTheDocument()
    play(0)
    play(1)
    expect(screen.getByRole('button', { name: 'Index 2: 7' })).toBeEnabled()
  })

  it('records answers under the original game, keeping its progress intact', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    playAll()
    // Score Total belongs to Function Forge: the arcade completed it there.
    expect(
      loadProgress().challenges[challengeKey('function-forge', 'score-total')],
    ).toEqual({ solved: true, mastered: true, recovered: false, xp: 100 })
    click('Back to games')
    const forge = screen
      .getByRole('heading', { name: 'Function Forge' })
      .closest('li')!
    expect(within(forge).getByText('Advanced 01/02')).toBeInTheDocument()
    // Arcade-only challenges have their own records.
    expect(saved(1)).toEqual({
      solved: true,
      mastered: true,
      recovered: false,
      xp: 100,
    })
    expect(saved(LAST)).toEqual({
      solved: true,
      mastered: true,
      recovered: false,
      xp: 100,
    })
  })
})

describe('Arcade XP and mastery', () => {
  it('pays normal XP: 0 for challenges already earned, 100 for new first tries', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    answerModule(arcadeModules[0].module, true)
    expect(screen.getByText('Replay · no XP')).toBeInTheDocument()
    expectTotalXp(CORE_XP)
    nextModule(false)
    answerModule(arcadeModules[1].module, true)
    expect(
      screen.getByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeInTheDocument()
    expectTotalXp(CORE_XP + 100)
  })

  it('wrong then right pays +25 then +75 and is recovered, not mastered', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    play(0)
    answerModule(arcadeModules[1].module, false)
    expectTotalXp(CORE_XP + 25)
    click('Try again')
    answerModule(arcadeModules[1].module, true)
    expectTotalXp(CORE_XP + 100)
    expect(saved(1)).toEqual({
      solved: true,
      mastered: false,
      recovered: true,
      xp: 100,
    })
  })

  it('a full run pays only each new challenge once; a replay pays 0', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    playAll()
    // Four of the eight were new: Delivery Gate, Score Total,
    // Override Switch and Shield Breach.
    expectStat('XP earned', '+400')
    expectTotalXp(CORE_XP + 400)
    click('Replay run')
    playAll()
    expectStat('XP earned', '+0')
    expectTotalXp(CORE_XP + 400)
    expect(
      screen.getByText(/XP for these challenges was already earned/),
    ).toBeInTheDocument()
  })

  it('a hint prevents mastery, as everywhere else', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    play(0)
    click('Show hint 1 of 3')
    answerModule(arcadeModules[1].module, true)
    expect(
      screen.queryByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeNull()
    expect(saved(1)).toEqual({
      solved: true,
      mastered: false,
      recovered: false,
      xp: 100,
    })
  })

  it('a wrong answer in the arcade never removes existing mastery', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    play(0, false)
    expect(saved(0)).toEqual({
      solved: true,
      mastered: true,
      recovered: false,
      xp: 100,
    })
  })
})

describe('Arcade best run', () => {
  it('is not recorded until a run reaches the end', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    for (let i = 0; i < LAST; i++) play(i)
    expect(loadProgress().arcade.best).toBeNull()
    click('← Games')
    expect(card().queryByText(/^Best/)).toBeNull()
  })

  it('keeps the better run: a weaker replay does not overwrite it, a stronger one does', () => {
    openGames(coreDone())
    click('Play Arcade Run')
    // Miss the first module (no retry) and the second (then show solution).
    playAll((i) => i > 1)
    expect(loadProgress().arcade.best).toEqual({
      correct: 6,
      firstTry: 6,
      accuracy: 75,
    })

    click('Replay run')
    playAll((i) => i > 2)
    expect(loadProgress().arcade.best).toEqual({
      correct: 6,
      firstTry: 6,
      accuracy: 75,
    })
    expect(screen.getByText('Arcade · Run complete')).toBeInTheDocument()

    click('Replay run')
    playAll()
    expect(screen.getByText('Arcade · New best run')).toBeInTheDocument()
    expect(screen.getByText('New best')).toBeInTheDocument()
    expect(loadProgress().arcade.best).toEqual({
      correct: 8,
      firstTry: 8,
      accuracy: 100,
    })
    click('Back to games')
    expect(
      card().getByText('Best 8/8 · 8 first try · 100%'),
    ).toBeInTheDocument()
  })
})

describe('Arcade reset', () => {
  it('Reset local progress clears the current run and the best run, and relocks it', () => {
    const { unmount } = openGames(coreDone())
    click('Play Arcade Run')
    playAll()
    click('Replay run')
    play(0)
    expect(loadProgress().arcade.run).not.toBeNull()
    expect(loadProgress().arcade.best).not.toBeNull()
    unmount()

    render(<App />)
    click('Reset local progress')
    click('Erase progress')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(loadProgress().arcade).toEqual({ run: null, runs: 0, best: null })
    expect(screen.queryByText(/Arcade/)).toBeNull()
    click('PLAY')
    expect(card().getByText('Arcade locked')).toBeInTheDocument()
    expect(card().queryByText(/^Best/)).toBeNull()
  })
})
