import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import RunSummary from './components/RunSummary.tsx'
import type { RunStats } from './game/useChallengeRun.ts'
import { applyAnswer, newProgress } from './progression/progress.ts'
import XpBadge from './components/XpBadge.tsx'
import { bugHuntChallenges } from './content/bugHuntChallenges.ts'
import { dataSorterChallenges } from './content/dataSorterChallenges.ts'
import { games } from './content/games.ts'
import BugHuntScreen from './screens/BugHuntScreen.tsx'
import DataSorterScreen from './screens/DataSorterScreen.tsx'
import { expectStat, renderWithProgress } from './test/render.tsx'

/** Retro UI layer: cartridges, HUD status, action bar, feedback, rewards. */

function patch(correct: boolean) {
  const challenge = bugHuntChallenges[0]
  const fix = challenge.fixes.find(
    (f) => (f.id === challenge.correctFixId) === correct,
  )!
  fireEvent.click(
    screen.getByRole('radio', { name: `Line ${fix.line} ${fix.code}` }),
  )
}

describe('game selection cartridges', () => {
  it('shows each game as a themed cartridge with its status and one play action', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))

    for (const game of games) {
      const card = screen
        .getByRole('heading', { name: game.name })
        .closest('li')!
      expect(card).toHaveAttribute('data-theme', game.id)
      expect(within(card).getByText(game.status)).toBeInTheDocument()
      expect(within(card).getByText(game.description)).toBeInTheDocument()
      // Artwork is decorative; the card's only control is its Play button.
      expect(card.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(within(card).getAllByRole('button')).toHaveLength(1)
      expect(
        within(card).getByRole('button', { name: `Play ${game.name}` }),
      ).toBeEnabled()
    }
  })
})

describe('home title screen', () => {
  it('offers one primary learning action and a secondary PLAY', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'START LEARNING' })).toHaveClass(
      'btn--primary',
    )
    expect(screen.getByRole('button', { name: 'PLAY' })).not.toHaveClass(
      'btn--primary',
    )
  })
})

describe('challenge HUD and action bar', () => {
  function renderBugHunt() {
    renderWithProgress(<BugHuntScreen onExit={vi.fn()} onPlayAgain={vi.fn()} />)
  }

  it('keeps the primary action disabled with a hint until an answer is picked', () => {
    renderBugHunt()
    const apply = screen.getByRole('button', { name: 'Apply patch' })
    expect(apply).toBeDisabled()
    expect(screen.getByText('Pick a patch')).toBeInTheDocument()

    patch(true)
    expect(apply).toBeEnabled()
    expect(screen.getByText('Patch loaded')).toBeInTheDocument()
  })

  it('shows SYSTEM ONLINE and a patched status after a correct answer', () => {
    renderBugHunt()
    expect(screen.getByRole('status')).toHaveTextContent('System: Corrupted')
    patch(true)
    fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))

    expect(screen.getByRole('status')).toHaveTextContent('System: Patched')
    expect(screen.getByText('System online')).toBeInTheDocument()
    // The action bar is replaced by the feedback's own Next button.
    expect(screen.queryByRole('button', { name: 'Apply patch' })).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Next challenge' }),
    ).toBeInTheDocument()
  })

  it('shows SYSTEM ERROR with the plain-language reason after a wrong answer', () => {
    renderBugHunt()
    patch(false)
    fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'System: Still corrupted',
    )
    expect(screen.getByText('System error')).toBeInTheDocument()
    expect(screen.getByText('What was wrong')).toBeInTheDocument()
  })

  it('reports Data Sorter status from online to sorted', () => {
    renderWithProgress(
      <DataSorterScreen onExit={vi.fn()} onPlayAgain={vi.fn()} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Data core: Online')

    const task = dataSorterChallenges[0].task
    if (task.kind !== 'pick') throw new Error('expected a pick task')
    const value = dataSorterChallenges[0].input[task.answerIndex]
    fireEvent.click(
      screen.getAllByRole('button', { name: new RegExp(`${value}$`) })[0],
    )
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByRole('status')).toHaveTextContent('Data core: Sorted')
  })
})

describe('XP rewards', () => {
  const gain = (container: HTMLElement) =>
    container.querySelector('.xp-badge__gain')

  it('pops the amount gained only when XP rises, and flags a level up', () => {
    const { container, rerender } = render(<XpBadge xp={250} />)
    expect(gain(container)).toBeNull()

    rerender(<XpBadge xp={275} />)
    expect(gain(container)).toHaveAttribute('data-text', '+25')

    rerender(<XpBadge xp={375} />)
    expect(gain(container)).toHaveAttribute('data-text', '+100 · LEVEL UP')
    expect(screen.getByText('LV 2')).toBeInTheDocument()
    // The popup is decorative: the total is announced once, as text.
    expect(gain(container)).toHaveAttribute('aria-hidden', 'true')
  })

  /** Bug Hunt with the given results per challenge, in order. */
  function bugHuntAfter(results: ('right' | 'wrong' | 'fixed')[]) {
    let p = newProgress()
    bugHuntChallenges.forEach(({ id }, i) => {
      const r = results[i]
      if (!r) return
      p = applyAnswer(p, 'bug-hunt', id, r === 'right').progress
      if (r === 'fixed') p = applyAnswer(p, 'bug-hunt', id, true).progress
    })
    return p
  }

  function renderSummary(
    progress: ReturnType<typeof newProgress>,
    stats: Partial<RunStats> = {},
  ) {
    renderWithProgress(
      <RunSummary
        game="bug-hunt"
        gameName="Bug Hunt"
        title="All bugs squashed"
        message="Nice hunting."
        challengeIds={bugHuntChallenges.map((c) => c.id)}
        stats={{ played: 5, correct: 3, runXp: 350, replay: false, ...stats }}
        onExit={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
      progress,
    )
  }

  it('shows the run reward, saved progress and what is left', () => {
    renderSummary(bugHuntAfter(['right', 'wrong', 'right', 'wrong', 'right']))
    expect(screen.getByText('Bug Hunt · Run complete')).toBeInTheDocument()
    expect(screen.getByText('+350')).toBeInTheDocument()
    expectStat('Modules complete', '3/5')
    expectStat('Mastered', '3/5')
    expect(screen.getByText('Game status: In progress')).toBeInTheDocument()
    expect(screen.getByText('2 modules left to complete.')).toBeInTheDocument()
    expect(screen.getByText('Level 2')).toBeInTheDocument()
    expect(screen.getByText('250 XP to level 3')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Retry unfinished' }),
    ).toBeInTheDocument()
  })

  it('stamps a completed game and offers a replay', () => {
    renderSummary(bugHuntAfter(['right', 'fixed', 'right', 'right', 'right']))
    expect(screen.getByText('Bug Hunt · Mission complete')).toBeInTheDocument()
    expect(screen.getByText('Game status: Complete')).toBeInTheDocument()
    expectStat('Mastered', '4/5')
    expect(
      screen.getByRole('button', { name: 'Replay Bug Hunt' }),
    ).toBeInTheDocument()
  })

  it('stamps a mastered game', () => {
    renderSummary(bugHuntAfter(['right', 'right', 'right', 'right', 'right']))
    expect(screen.getByText('Bug Hunt · Game mastered')).toBeInTheDocument()
    expect(
      screen.getByText('Every module mastered on the first try.'),
    ).toBeInTheDocument()
  })

  it('says a replay earned no new XP', () => {
    renderSummary(bugHuntAfter(['right', 'right', 'right', 'right', 'right']), {
      replay: true,
      runXp: 0,
    })
    expect(screen.getByText('Bug Hunt · Replay')).toBeInTheDocument()
    expect(screen.getByText('+0')).toBeInTheDocument()
    expect(
      screen.getByText(/XP for these modules was already earned/),
    ).toBeInTheDocument()
  })
})
