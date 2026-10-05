import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { levelForXp } from './game/xp.ts'
import { codeBreakerChallenges } from './content/codeBreakerChallenges.ts'
import { foundations } from './content/foundations.ts'
import { bugHuntModules } from './content/gameChallenges.ts'
import {
  applyAnswer,
  newProgress,
  type Progress,
} from './progression/progress.ts'
import { saveProgress, STORAGE_KEY } from './progression/storage.ts'
import { tierOf } from './challenges/meta.ts'
import { sectionOf } from './progression/progress.ts'
import { answerBugHunt, nextModule } from './test/play.ts'
import { expectStep } from './test/progress.ts'
import { expectStat, expectTotalXp } from './test/render.tsx'

/** Closes the app and opens it again, like a page reload. */
function reload(unmount: () => void) {
  unmount()
  return render(<App />)
}

const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }))

/** Answers Bug Hunt module `i` (a patch or a write module). */
const patch = (i: number, correct: boolean) =>
  answerBugHunt(bugHuntModules[i], correct)

const tiers = bugHuntModules.map(tierOf)
const ALL = bugHuntModules.map(() => true)

/** Plays Bug Hunt from module `from` with these results, to the end of its tier. */
function playBugHunt(results: boolean[], from = 0) {
  const { end } = sectionOf(tiers, from)
  results.forEach((correct, i) => {
    patch(from + i, correct)
    nextModule(from + i === end)
  })
}

/** Plays every tier of Bug Hunt with first-try answers, following the summary. */
function playAllOfBugHunt() {
  click('Play Bug Hunt')
  playBugHunt([true, true, true, true, true, true, true])
  click('Play Advanced')
  const advanced = tiers.filter((t) => t === 'advanced').map(() => true)
  playBugHunt(advanced, tiers.indexOf('advanced'))
  click('Play Boss')
  playBugHunt([true], tiers.indexOf('boss'))
}

/** Saved Bug Hunt progress: true = mastered, false = missed (unsolved). */
function savedBugHunt(results: boolean[]): Progress {
  let p = newProgress()
  results.forEach((correct, i) => {
    p = applyAnswer(p, 'bug-hunt', bugHuntModules[i].id, correct).progress
  })
  return p
}

const card = (name: string) =>
  screen.getByRole('heading', { name }).closest('li')!

function openGames() {
  render(<App />)
  click('PLAY')
}

describe('persistent progress', () => {
  it('starts a new player fresh, with nothing saved yet', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: 'START LEARNING' }),
    ).toBeInTheDocument()
    expectTotalXp(0)
    expect(screen.getByText('LV 1')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps XP, Foundations, and challenge results across a reload', () => {
    const { unmount } = render(<App />)
    click('START LEARNING')
    click('Start Variables')
    const micro = foundations[0].micro
    if (micro.kind !== 'choice') throw new Error('expected a choice')
    const option = micro.options.find((o) => o.id === micro.correctOptionId)!
    fireEvent.click(screen.getByRole('radio', { name: option.code }))
    click('Check answer')
    click('Practise in Bug Hunt')
    patch(0, true)
    expectTotalXp(125)

    reload(unmount)
    expect(
      screen.getByRole('button', { name: 'CONTINUE LEARNING' }),
    ).toBeInTheDocument()
    expectTotalXp(125)
    expect(
      screen.getByText('Python Foundations · 1/9 concepts'),
    ).toBeInTheDocument()

    click('CONTINUE LEARNING')
    expect(screen.getByText('1 / 9 concepts completed')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Review Variables' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Start Data types' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Operators is locked' }),
    ).toBeDisabled()

    click(/Home/)
    click('PLAY')
    expect(
      within(card('Bug Hunt')).getByText('In progress'),
    ).toBeInTheDocument()
    expect(
      within(card('Bug Hunt')).getByText('Modules 01 / 12'),
    ).toBeInTheDocument()
  })

  it('keeps a completed and a mastered game across a reload', () => {
    const { unmount } = render(<App />)
    click('PLAY')
    playAllOfBugHunt()
    expect(screen.getByText('Bug Hunt · Game mastered')).toBeInTheDocument()

    reload(unmount)
    click('PLAY')
    expect(within(card('Bug Hunt')).getByText('Mastered')).toBeInTheDocument()
    // The art readout switches to the game's success state.
    expect(within(card('Bug Hunt')).getByText('Patched')).toBeInTheDocument()
    expect(within(card('Code Breaker')).getByText('Locked')).toBeInTheDocument()
    expect(
      within(card('Bug Hunt')).getByText('Modules 12 / 12'),
    ).toBeInTheDocument()
    expect(within(card('Code Breaker')).getByText('New')).toBeInTheDocument()
    expectTotalXp(bugHuntModules.length * 100)
    expect(
      screen.getByText(`LV ${levelForXp(bugHuntModules.length * 100)}`),
    ).toBeInTheDocument()
  })

  it('does not replay XP or level-up feedback when progress is restored', () => {
    saveProgress({ ...newProgress(), xp: 350 })
    const { container } = render(<App />)
    expectTotalXp(350)
    expect(screen.getByText('LV 2')).toBeInTheDocument()
    expect(container.querySelector('.xp-badge__gain')).toBeNull()
  })
})

describe('cartridge status', () => {
  it.each([
    ['New', [], 'Modules 00 / 12', ['Play Bug Hunt']],
    [
      'In progress',
      [true, false],
      'Modules 01 / 12',
      ['Continue Bug Hunt', 'Replay Bug Hunt from the start'],
    ],
    ['Mastered', ALL, 'Modules 12 / 12', ['Replay Bug Hunt']],
  ] as const)('shows %s', (label, results, count, buttons) => {
    saveProgress(savedBugHunt([...results]))
    openGames()
    const bugHunt = within(card('Bug Hunt'))
    expect(bugHunt.getByText(label)).toBeInTheDocument()
    expect(bugHunt.getByText(count)).toBeInTheDocument()
    expect(
      bugHunt.getAllByRole('button').map((b) => b.getAttribute('aria-label')),
    ).toEqual(buttons)
  })

  it('shows Complete when every module is solved but not all first try', () => {
    let p = savedBugHunt([true, false, ...ALL.slice(2)])
    p = applyAnswer(p, 'bug-hunt', bugHuntModules[1].id, true).progress
    saveProgress(p)
    openGames()
    expect(within(card('Bug Hunt')).getByText('Complete')).toBeInTheDocument()
  })
})

describe('continue, replay and mastery', () => {
  it('continues at the first unfinished module', () => {
    saveProgress(savedBugHunt([true, false]))
    openGames()
    click('Continue Bug Hunt')
    expectStep('Bug Hunt', 2, 12)
  })

  it('replays a finished game from module 01 without paying XP again', () => {
    saveProgress(savedBugHunt(ALL))
    openGames()
    click('Replay Bug Hunt')
    expectStep('Bug Hunt', 1, 12)
    expect(
      screen.getByText('Mastered', { selector: '.game-hud__mark' }),
    ).toBeInTheDocument()

    patch(0, true)
    expect(screen.getByText('Replay · no XP')).toBeInTheDocument()
    expect(screen.queryByText(/^\+\d+ XP$/)).toBeNull()
    expectTotalXp(bugHuntModules.length * 100)

    // A wrong replay answer neither pays nor removes mastery.
    click('Next challenge')
    patch(1, false)
    expectTotalXp(bugHuntModules.length * 100)
    click('Next challenge')
    playBugHunt([true, true, true, true, true], 2)
    expect(screen.getByText('Bug Hunt · Replay')).toBeInTheDocument()
    expectStat('XP earned', '+0')
    expectStat('Mastered', `${bugHuntModules.length}/${bugHuntModules.length}`)
    expect(
      screen.getByText(/XP for these modules was already earned/),
    ).toBeInTheDocument()
  })

  it('completes, but does not master, a module missed on the first try', () => {
    saveProgress(savedBugHunt([true, false, true, true, true, true, true]))
    openGames()
    click('Continue Bug Hunt')
    expectStep('Bug Hunt', 2, 12)
    patch(1, true)
    // Tops the module up to 100 XP in total (25 already paid).
    expect(screen.getByText('+75 XP')).toBeInTheDocument()
    expect(
      screen.queryByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeNull()
    click('Next challenge')
    playBugHunt([true, true, true, true, true], 2)
    // Core is now complete, but the game is not: Advanced opens next.
    expect(screen.getByText('Bug Hunt · Core complete')).toBeInTheDocument()
    expectStat('Modules complete', '7/12')
    expectStat('Mastered', '6/12')
    expect(
      screen.getByText(
        'Advanced modules unlocked: they combine what you just practised.',
      ),
    ).toBeInTheDocument()
    click('Play Advanced')
    expectStep('Bug Hunt', 8, 12)
  })

  it('marks a first-try win as mastered', () => {
    openGames()
    click('Play Code Breaker')
    const lock = codeBreakerChallenges[0]
    const right = lock.options.find((o) => o.id === lock.correctOptionId)!
    fireEvent.click(screen.getByRole('radio', { name: right.code }))
    click('Attempt unlock')
    expect(
      screen.getByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
  })

  it('offers to retry unfinished modules from the completion screen', () => {
    openGames()
    click('Play Bug Hunt')
    playBugHunt([true, false, true, true, true, true, true])
    expect(screen.getByText('1 module left to complete.')).toBeInTheDocument()
    click('Retry unfinished')
    expectStep('Bug Hunt', 2, 12)
  })
})

describe('reset local progress', () => {
  it('asks for confirmation, and Cancel keeps everything', () => {
    saveProgress(savedBugHunt([true]))
    render(<App />)
    click('Reset local progress')
    expect(
      screen.getByRole('alertdialog', { name: 'Reset local progress?' }),
    ).toBeInTheDocument()
    // Cancel is focused, so Enter cannot erase by accident.
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    click('Cancel')
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Reset local progress' }),
    ).toHaveFocus()

    // Escape also cancels.
    click('Reset local progress')
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expectTotalXp(100)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('erases saved progress and returns to a fresh player', () => {
    saveProgress({ ...savedBugHunt([true, true]), concepts: ['variables'] })
    const { unmount } = render(<App />)
    expectTotalXp(200)
    click('Reset local progress')
    click('Erase progress')

    expect(screen.getByRole('status')).toHaveTextContent('Progress reset')
    expectTotalXp(0)
    expect(
      screen.getByRole('button', { name: 'START LEARNING' }),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    reload(unmount)
    expectTotalXp(0)
    click('PLAY')
    expect(within(card('Bug Hunt')).getByText('New')).toBeInTheDocument()
  })

  it('leaves other sites data alone', () => {
    localStorage.setItem('someone-else', 'keep')
    saveProgress(savedBugHunt([true]))
    render(<App />)
    click('Reset local progress')
    click('Erase progress')
    expect(localStorage.getItem('someone-else')).toBe('keep')
  })
})
