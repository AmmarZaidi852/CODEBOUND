import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { bugHuntChallenges } from './content/bugHuntChallenges.ts'
import { codeBreakerChallenges } from './content/codeBreakerChallenges.ts'
import { dataSorterChallenges } from './content/dataSorterChallenges.ts'
import { tierOf } from './challenges/meta.ts'
import { bugHuntModules } from './content/gameChallenges.ts'
import { answerBugHunt, nextModule } from './test/play.ts'
import { expectStep } from './test/progress.ts'

describe('App', () => {
  it('shows the home screen with title, tagline, and starting progress', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'CODEBOUND' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Learn Python. Play the Code.')).toBeInTheDocument()
    expect(screen.getByText('LV 1')).toBeInTheDocument()
    expect(screen.getByText('0 XP')).toBeInTheDocument()
  })

  it('opens game selection from PLAY with all three games playable', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))

    expect(
      screen.getByRole('heading', { name: 'Choose your game' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play Bug Hunt' })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Play Code Breaker' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Play Data Sorter' }),
    ).toBeEnabled()
    expect(screen.queryByRole('button', { name: /is locked/ })).toBeNull()
  })

  it('opens Data Sorter from game selection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Data Sorter' }))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: dataSorterChallenges[0].name,
      }),
    ).toBeInTheDocument()
    expectStep('Data Sorter', 1, 15)
  })

  it('opens Code Breaker from game selection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Code Breaker' }))

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: codeBreakerChallenges[0].system,
      }),
    ).toBeInTheDocument()
    expectStep('Code Breaker', 1, 12)
  })

  it('returns home from game selection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(screen.getByRole('button', { name: 'PLAY' })).toBeInTheDocument()
  })

  it('plays the full Bug Hunt loop and keeps XP across screens', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Bug Hunt' }))

    // The Core run: patches and write modules alike, all first try.
    const core = bugHuntModules.filter((m) => tierOf(m) === 'core')
    core.forEach((module, i) => {
      answerBugHunt(module, true)
      expect(screen.getByText(`${(i + 1) * 100} XP`)).toBeInTheDocument()
      nextModule(i === core.length - 1)
    })

    expect(
      screen.getByRole('heading', { name: 'All bugs squashed' }),
    ).toBeInTheDocument()
    expect(screen.getByText('LV 3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to games' }))
    expect(
      screen.getByRole('heading', { name: 'Choose your game' }),
    ).toBeInTheDocument()
    expect(screen.getByText('700 XP')).toBeInTheDocument()
  })

  it('shares one XP total across Bug Hunt and Code Breaker', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))

    // Bug Hunt: one correct answer, then leave mid-run.
    fireEvent.click(screen.getByRole('button', { name: 'Play Bug Hunt' }))
    const bug = bugHuntChallenges[0]
    const fix = bug.fixes.find((f) => f.id === bug.correctFixId)!
    fireEvent.click(
      screen.getByRole('radio', { name: `Line ${fix.line} ${fix.code}` }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))
    expect(screen.getByText('100 XP')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Games/ }))

    // Code Breaker: one wrong answer adds to the same total.
    fireEvent.click(screen.getByRole('button', { name: 'Play Code Breaker' }))
    expect(screen.getByText('100 XP')).toBeInTheDocument()
    const lock = codeBreakerChallenges[0]
    const wrong = lock.options.find((o) => o.id !== lock.correctOptionId)!
    fireEvent.click(screen.getByRole('radio', { name: wrong.code }))
    fireEvent.click(screen.getByRole('button', { name: 'Attempt unlock' }))
    expect(screen.getByText('125 XP')).toBeInTheDocument()

    // Back on the selection screen the total is unchanged (no double award).
    fireEvent.click(screen.getByRole('button', { name: /Games/ }))
    expect(screen.getByText('125 XP')).toBeInTheDocument()

    // Re-entering Bug Hunt continues at the first unfinished module and
    // keeps the XP total.
    fireEvent.click(screen.getByRole('button', { name: 'Continue Bug Hunt' }))
    expectStep('Bug Hunt', 2, 12)
    expect(screen.getByText('125 XP')).toBeInTheDocument()
  })

  it('carries XP from Bug Hunt and Code Breaker into Data Sorter and back', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))

    // Bug Hunt: +100.
    fireEvent.click(screen.getByRole('button', { name: 'Play Bug Hunt' }))
    const bug = bugHuntChallenges[0]
    const fix = bug.fixes.find((f) => f.id === bug.correctFixId)!
    fireEvent.click(
      screen.getByRole('radio', { name: `Line ${fix.line} ${fix.code}` }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))
    fireEvent.click(screen.getByRole('button', { name: /Games/ }))

    // Code Breaker: +100.
    fireEvent.click(screen.getByRole('button', { name: 'Play Code Breaker' }))
    const lock = codeBreakerChallenges[0]
    const unlock = lock.options.find((o) => o.id === lock.correctOptionId)!
    fireEvent.click(screen.getByRole('radio', { name: unlock.code }))
    fireEvent.click(screen.getByRole('button', { name: 'Attempt unlock' }))
    fireEvent.click(screen.getByRole('button', { name: /Games/ }))

    // Data Sorter starts with the XP from both games, then adds to it.
    fireEvent.click(screen.getByRole('button', { name: 'Play Data Sorter' }))
    expect(screen.getByText('200 XP')).toBeInTheDocument()
    const first = dataSorterChallenges[0]
    if (first.task.kind !== 'pick') throw new Error('expected a pick task')
    fireEvent.click(
      screen.getByRole('button', {
        name: String(first.input[first.task.answerIndex]),
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('300 XP')).toBeInTheDocument()
    expect(screen.getByText('LV 2')).toBeInTheDocument()

    // Leaving keeps the total, with no extra award.
    fireEvent.click(screen.getByRole('button', { name: /Games/ }))
    expect(screen.getByText('300 XP')).toBeInTheDocument()
  })
})
