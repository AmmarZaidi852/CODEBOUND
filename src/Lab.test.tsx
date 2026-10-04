import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { arcadeChallenges } from './content/arcade.ts'
import { gameModules } from './content/gameChallenges.ts'
import {
  applyAnswer,
  challengeKey,
  newProgress,
  type ChallengeSource,
  type Progress,
} from './progression/progress.ts'
import {
  loadProgress,
  saveProgress,
  STORAGE_KEY,
} from './progression/storage.ts'
import { answerModule } from './test/play.ts'
import { expectStep } from './test/progress.ts'
import { expectTotalXp } from './test/render.tsx'

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

const moduleOf = (source: ChallengeSource, id: string) =>
  (source === 'arcade'
    ? arcadeChallenges
    : gameModules[source as Exclude<ChallengeSource, 'arcade'>]
  ).find((m) => m.id === id)!

function play(
  p: Progress,
  source: ChallengeSource,
  id: string,
  result: 'right' | 'wrong' | 'fixed' = 'right',
) {
  if (result !== 'right') p = applyAnswer(p, source, id, false).progress
  if (result === 'wrong') return p
  return applyAnswer(p, source, id, true).progress
}

/** Variables mastered, Average Disaster missed (not solved yet). */
const started = () =>
  play(
    play(newProgress(), 'bug-hunt', 'variables'),
    'bug-hunt',
    'arithmetic',
    'wrong',
  )

const saved = (source: ChallengeSource, id: string) =>
  loadProgress().challenges[challengeKey(source, id)]

/** Saves progress, renders the app and opens the Lab from Home. */
function openLab(progress: Progress) {
  saveProgress(progress)
  const view = render(<App />)
  click('Open Lab')
  return view
}

const targets = () =>
  within(screen.getByRole('region', { name: 'Your next targets' }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('.lab-target__title')!.textContent)

/** Answers the practised module and finishes to the result panel. */
function practise(source: ChallengeSource, id: string, correct: boolean) {
  answerModule(moduleOf(source, id), correct)
  const reveal = screen.queryByRole('button', { name: 'Show solution' })
  if (reveal) fireEvent.click(reveal)
  click('Finish')
}

describe('Mastery Lab on Home', () => {
  it('stays hidden until a challenge is solved', () => {
    saveProgress(play(newProgress(), 'bug-hunt', 'variables', 'wrong'))
    render(<App />)
    expect(screen.queryByRole('region', { name: 'Mastery Lab' })).toBeNull()
  })

  it('appears as a small panel with how many modules need practice', () => {
    saveProgress(started())
    render(<App />)
    const panel = within(screen.getByRole('region', { name: 'Mastery Lab' }))
    expect(panel.getByText('1 module needs practice')).toBeInTheDocument()
    expect(panel.getByRole('button', { name: 'Open Lab' })).toBeEnabled()
    // The main path is unchanged.
    expect(
      screen.getByRole('button', { name: 'START LEARNING' }),
    ).toBeInTheDocument()
  })
})

describe('Mastery Lab recommendations', () => {
  it('lists the missed module first, then new challenges across games', () => {
    openLab(started())
    expect(targets()).toEqual([
      'Average Disaster',
      'Ticket Counter',
      'Keypad Lock',
      'Score Feed',
      'Define It',
    ])
    expect(screen.getByText('Missed before')).toBeInTheDocument()
  })

  it('never lists locked advanced, boss or Arcade modules', () => {
    openLab(started())
    expect(screen.queryByText(/· Advanced|· Boss|Arcade/)).toBeNull()
  })

  it('gives the same recommendations after a reload', () => {
    const { unmount } = openLab(started())
    const before = targets()
    unmount()
    render(<App />)
    click('Open Lab')
    expect(targets()).toEqual(before)
  })
})

describe('Mastery Lab practice uses the canonical challenge', () => {
  it('opens the module exactly as in its game', () => {
    openLab(started())
    click('Practice Average Disaster')
    expectStep('Bug Hunt', 2, 10)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Average Disaster' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mastery Lab · Missed before')).toBeInTheDocument()
  })

  it('a missed module solved in the Lab pays the +75 top-up, is recovered, and updates the game', () => {
    openLab(started())
    expectTotalXp(125)
    click('Practice Average Disaster')
    practise('bug-hunt', 'arithmetic', true)
    expectTotalXp(200)
    expect(saved('bug-hunt', 'arithmetic')).toEqual({
      solved: true,
      mastered: false,
      recovered: true,
      xp: 100,
    })
    expect(screen.getByText('Target cleared')).toBeInTheDocument()
    expect(
      screen.getByText('Recovered', { selector: 'dd' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/cleared it through practice/)).toBeInTheDocument()

    // The game sees the same record.
    click('Back to Lab')
    click('← Home')
    click('PLAY')
    const card = screen
      .getByRole('heading', { name: 'Bug Hunt' })
      .closest('li')!
    expect(within(card).getByText('Modules 02 / 10')).toBeInTheDocument()
  })

  it('a wrong answer follows the normal rules and says what is left', () => {
    openLab(started())
    click('Practice Average Disaster')
    practise('bug-hunt', 'arithmetic', false)
    // The first miss already paid +25; another miss pays nothing.
    expectTotalXp(125)
    expect(
      screen.getByText('Not solved yet', { selector: 'h1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Solving it later pays the remaining +75 XP.'),
    ).toBeInTheDocument()
  })

  it('mastery earned in the Lab appears in the original game', () => {
    openLab(started())
    click('Practice Keypad Lock')
    practise('code-breaker', 'basic-if', true)
    expectTotalXp(225)
    expect(saved('code-breaker', 'basic-if')).toMatchObject({
      mastered: true,
    })
    click('Back to Lab')
    click('← Home')
    click('PLAY')
    click('Replay Code Breaker from the start')
    expect(
      screen.getByText('Mastered', { selector: '.game-hud__mark' }),
    ).toBeInTheDocument()
  })

  it('practising an already-paid module pays no XP again; a clean solve recovers it', () => {
    // Solved after the miss, but with a hint: paid in full, not cleared.
    const p = applyAnswer(
      started(),
      'bug-hunt',
      'arithmetic',
      true,
      true,
    ).progress
    openLab(p)
    expect(screen.getByText('Not mastered')).toBeInTheDocument()
    click('Practice Average Disaster')
    answerModule(moduleOf('bug-hunt', 'arithmetic'), true)
    expect(screen.getByText('Replay · no XP')).toBeInTheDocument()
    expect(
      screen.getByText('Recovered', { selector: '.feedback__recovered' }),
    ).toBeInTheDocument()
    expectTotalXp(200)
  })
})

describe('Mastery Lab completion flow', () => {
  it('Next practice opens the next recommendation, not the same module', () => {
    openLab(started())
    click('Practice Average Disaster')
    practise('bug-hunt', 'arithmetic', true)
    expect(screen.getByText('Ticket Counter')).toBeInTheDocument()
    click('Next practice')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ticket Counter' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mastery Lab · New challenge')).toBeInTheDocument()
  })

  it('Back to Lab returns to the updated queue', () => {
    openLab(started())
    click('Practice Average Disaster')
    practise('bug-hunt', 'arithmetic', true)
    click('Back to Lab')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Mastery Lab' }),
    ).toBeInTheDocument()
    // Recovered: it leaves the targets for good.
    expect(targets()).not.toContain('Average Disaster')
    expect(screen.queryByText('Missed before')).toBeNull()
    expect(screen.queryByText('Not mastered')).toBeNull()
  })
})

describe('Mastery Lab concepts', () => {
  it('shows each concept from saved progress and opens its recommendations', () => {
    openLab(started())
    const operators = screen.getByRole('button', { name: /^Operators/ })
    expect(operators).toHaveAttribute('aria-expanded', 'false')
    expect(within(operators).getByText('Practice')).toBeInTheDocument()
    fireEvent.click(operators)
    expect(operators).toHaveAttribute('aria-expanded', 'true')
    const detail = within(document.getElementById('lab-concept-detail')!)
    expect(detail.getByText('Average Disaster')).toBeInTheDocument()
    expect(detail.getByText('Ticket Counter')).toBeInTheDocument()

    click('Practice Operators')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Average Disaster' }),
    ).toBeInTheDocument()
  })

  it('marks concepts nobody has touched as not started', () => {
    openLab(started())
    const loops = screen.getByRole('button', { name: /^Loops/ })
    expect(within(loops).getByText('Not started')).toBeInTheDocument()
    expect(
      within(loops).getByRole('progressbar', {
        name: 'Loops modules cleared',
      }),
    ).toHaveAttribute(
      'aria-valuetext',
      expect.stringMatching(/^0 mastered and 0 recovered of \d+ modules$/),
    )
  })
})

describe('Mastery Lab when everything is mastered', () => {
  function everything() {
    let p = newProgress()
    for (const [game, modules] of Object.entries(gameModules)) {
      for (const m of modules) p = play(p, game as ChallengeSource, m.id)
    }
    for (const c of arcadeChallenges) p = play(p, 'arcade', c.id)
    return p
  }

  it('says so on Home and in the Lab, with replay and review actions', () => {
    saveProgress(everything())
    render(<App />)
    const panel = within(screen.getByRole('region', { name: 'Mastery Lab' }))
    expect(panel.getByText('All current modules mastered')).toBeInTheDocument()
    click('Review')
    expect(
      screen.getByRole('heading', { name: 'All current modules mastered' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Your next targets' }),
    ).toBeNull()
    click('Replay Arcade')
    expectStep('Arcade Run', 1, 8)
  })

  it('Review Foundations and Back to Home work from the Lab', () => {
    saveProgress(everything())
    render(<App />)
    click('Review')
    click('Review Foundations')
    expect(
      screen.getByRole('heading', { name: 'Python Foundations' }),
    ).toBeInTheDocument()
  })
})

describe('Mastery Lab reset', () => {
  it('Reset local progress clears the state the Lab is derived from', () => {
    saveProgress(started())
    render(<App />)
    expect(
      screen.getByRole('region', { name: 'Mastery Lab' }),
    ).toBeInTheDocument()
    click('Reset local progress')
    click('Erase progress')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(screen.queryByRole('region', { name: 'Mastery Lab' })).toBeNull()
  })
})
