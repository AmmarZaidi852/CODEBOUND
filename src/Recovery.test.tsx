import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { arcadeChallenges, arcadeModules } from './content/arcade.ts'
import {
  bugHuntModules,
  gameChallengeIds,
  gameModules,
  gameModuleTiers,
} from './content/gameChallenges.ts'
import { games } from './content/games.ts'
import {
  applyAnswer,
  challengeKey,
  newProgress,
  type ChallengeSource,
  type Progress,
} from './progression/progress.ts'
import { loadProgress, saveProgress } from './progression/storage.ts'
import { answerBugHunt, answerModule, nextModule } from './test/play.ts'
import { expectStat, expectTotalXp } from './test/render.tsx'

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

const play = (
  p: Progress,
  source: ChallengeSource,
  id: string,
  result: 'right' | 'wrong' | 'fixed' = 'right',
) => {
  if (result !== 'right') p = applyAnswer(p, source, id, false).progress
  if (result === 'wrong') return p
  return applyAnswer(p, source, id, true).progress
}

const record = (source: ChallengeSource, id: string) =>
  loadProgress().challenges[challengeKey(source, id)]

const targets = () =>
  within(screen.getByRole('region', { name: 'Your next targets' }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.lab-target__title')!.textContent)

/** Every released module solved; `fixed` ids recovered, the rest first try. */
function everything(fixed: string[] = []) {
  let p = newProgress()
  for (const [game, modules] of Object.entries(gameModules)) {
    for (const m of modules) {
      p = play(
        p,
        game as ChallengeSource,
        m.id,
        fixed.includes(m.id) ? 'fixed' : 'right',
      )
    }
  }
  for (const c of arcadeChallenges) p = play(p, 'arcade', c.id)
  return p
}

describe('Recovery in the games', () => {
  it('a missed module solved on a later replay is recovered, with the normal +75', () => {
    // Variables mastered, Average Disaster missed in an earlier run.
    let p = play(newProgress(), 'bug-hunt', 'variables')
    p = play(p, 'bug-hunt', 'arithmetic', 'wrong')
    saveProgress(p)
    render(<App />)
    click('PLAY')
    click('Continue Bug Hunt')
    answerBugHunt(bugHuntModules[1], true)
    expect(screen.getByText('+75 XP')).toBeInTheDocument()
    expect(
      screen.getByText('Recovered', { selector: '.feedback__recovered' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeNull()
    expectTotalXp(200)
    expect(record('bug-hunt', 'arithmetic')).toEqual({
      solved: true,
      mastered: false,
      recovered: true,
      xp: 100,
    })
  })

  it('a replay shows RECOVERED on the HUD and pays nothing', () => {
    let p = play(newProgress(), 'bug-hunt', 'variables')
    p = play(p, 'bug-hunt', 'arithmetic', 'fixed')
    saveProgress(p)
    render(<App />)
    click('PLAY')
    click('Replay Bug Hunt from the start')
    answerBugHunt(bugHuntModules[0], true)
    nextModule(false)
    expect(
      screen.getByText('Recovered', { selector: '.game-hud__mark' }),
    ).toBeInTheDocument()
    answerBugHunt(bugHuntModules[1], true)
    expect(screen.getByText('Replay · no XP')).toBeInTheDocument()
    expect(
      screen.queryByText('Recovered', { selector: '.feedback__recovered' }),
    ).toBeNull()
  })

  it('the completion screen counts mastered and recovered modules separately', () => {
    let p = newProgress()
    const core = gameChallengeIds['bug-hunt'].filter(
      (_, i) => gameModuleTiers['bug-hunt'][i] === 'core',
    )
    core.slice(0, -1).forEach((id, i) => {
      p = play(p, 'bug-hunt', id, i < 2 ? 'fixed' : 'right')
    })
    saveProgress(p)
    render(<App />)
    click('PLAY')
    click('Continue Bug Hunt')
    answerBugHunt(bugHuntModules[core.length - 1], true)
    nextModule(true)
    expectStat('Mastered', '5/10')
    expectStat('Recovered', '2')
  })
})

describe('Recovery in the Mastery Lab', () => {
  const started = () =>
    play(
      play(newProgress(), 'bug-hunt', 'variables'),
      'bug-hunt',
      'arithmetic',
      'wrong',
    )

  it('miss → Lab target → clean solve → recovered, gone from targets, kept after reload, shown in the game', () => {
    saveProgress(started())
    const { unmount } = render(<App />)
    click('Open Lab')
    expect(targets()[0]).toBe('Average Disaster')
    expect(screen.getByText('Missed before')).toBeInTheDocument()
    click('Practice Average Disaster')
    answerModule(bugHuntModules[1], true)
    expect(screen.getByText('+75 XP')).toBeInTheDocument()
    click('Finish')
    expect(
      screen.getByText('Recovered', { selector: 'dd' }),
    ).toBeInTheDocument()
    click('Back to Lab')
    expect(targets()).not.toContain('Average Disaster')
    unmount()

    render(<App />)
    expect(record('bug-hunt', 'arithmetic')?.recovered).toBe(true)
    click('Open Lab')
    expect(targets()).not.toContain('Average Disaster')
    click('← Home')
    click('PLAY')
    click('Replay Bug Hunt from the start')
    answerBugHunt(bugHuntModules[0], true)
    nextModule(false)
    expect(
      screen.getByText('Recovered', { selector: '.game-hud__mark' }),
    ).toBeInTheDocument()
  })

  it('concept detail splits mastered, recovered and still to clear', () => {
    let p = play(newProgress(), 'data-sorter', 'indexing')
    p = play(p, 'data-sorter', 'set-item', 'fixed')
    p = play(p, 'data-sorter', 'pop', 'wrong')
    saveProgress(p)
    render(<App />)
    click('Open Lab')
    fireEvent.click(screen.getByRole('button', { name: /^Indexing/ }))
    const detail = within(document.getElementById('lab-concept-detail')!)
    expect(
      detail.getByText(/1 \/ 5 mastered · 1 recovered · 3 to clear/),
    ).toBeInTheDocument()
  })

  it('all cleared is its own state, separate from all first-try mastered', () => {
    saveProgress(everything(['variables', 'pop']))
    const { unmount } = render(<App />)
    const panel = within(screen.getByRole('region', { name: 'Mastery Lab' }))
    expect(panel.getByText('All current modules cleared')).toBeInTheDocument()
    click('Review')
    expect(
      screen.getByRole('heading', { name: 'All current modules cleared' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('All current modules mastered')).toBeNull()
    expectStat('Recovered', '2')
    unmount()

    saveProgress(everything())
    render(<App />)
    click('Review')
    expect(
      screen.getByRole('heading', { name: 'All current modules mastered' }),
    ).toBeInTheDocument()
    expectStat('Recovered', '0')
  })
})

describe('Recovery through the Arcade', () => {
  function coreDone() {
    let p = newProgress()
    for (const { id: game } of games) {
      gameChallengeIds[game].forEach((id, i) => {
        if (gameModuleTiers[game][i] === 'core') p = play(p, game, id)
      })
    }
    return p
  }

  it('shares recovery with the Lab and keeps the best run rules', () => {
    saveProgress(coreDone())
    render(<App />)
    click('PLAY')
    click('Play Arcade Run')
    answerModule(arcadeModules[0].module, true)
    nextModule(false)
    // Delivery Gate: miss, then a clean retry.
    answerModule(arcadeModules[1].module, false)
    click('Try again')
    answerModule(arcadeModules[1].module, true)
    expect(
      screen.getByText('Recovered', { selector: '.feedback__recovered' }),
    ).toBeInTheDocument()
    expect(record('arcade', 'delivery-gate')).toMatchObject({
      mastered: false,
      recovered: true,
    })
    // The run still counts it as solved, but not on the first try.
    expect(loadProgress().arcade.run).toMatchObject({
      correct: 2,
      firstTry: 1,
    })
    click('← Games')
    click('← Home')
    click('Open Lab')
    expect(targets()).not.toContain('Delivery Gate')
  })
})

describe('Recovery and reset', () => {
  it('Reset local progress removes recovery with everything else', () => {
    saveProgress(play(newProgress(), 'bug-hunt', 'arithmetic', 'fixed'))
    render(<App />)
    expect(record('bug-hunt', 'arithmetic')?.recovered).toBe(true)
    click('Reset local progress')
    click('Erase progress')
    expect(record('bug-hunt', 'arithmetic')).toBeUndefined()
    expect(loadProgress()).toEqual(newProgress())
  })
})
