import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { bugHuntChallenges } from './content/bugHuntChallenges.ts'
import { codeBreakerChallenges } from './content/codeBreakerChallenges.ts'

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

  it('opens game selection from PLAY with Bug Hunt and Code Breaker playable and Data Sorter locked', () => {
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
      screen.getByRole('button', { name: 'Data Sorter is locked' }),
    ).toBeDisabled()
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
    expect(screen.getByText('Code Breaker · 1/5')).toBeInTheDocument()
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

    bugHuntChallenges.forEach((challenge, i) => {
      const fix = challenge.fixes.find((f) => f.id === challenge.correctFixId)!
      fireEvent.click(
        screen.getByRole('radio', { name: `Line ${fix.line} ${fix.code}` }),
      )
      fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))
      expect(screen.getByText(`${(i + 1) * 100} XP`)).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', {
          name:
            i === bugHuntChallenges.length - 1 ? 'Finish' : 'Next challenge',
        }),
      )
    })

    expect(
      screen.getByRole('heading', { name: 'All bugs squashed' }),
    ).toBeInTheDocument()
    expect(screen.getByText('LV 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back to games' }))
    expect(
      screen.getByRole('heading', { name: 'Choose your game' }),
    ).toBeInTheDocument()
    expect(screen.getByText('500 XP')).toBeInTheDocument()
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

    // Re-entering Bug Hunt starts a fresh run but keeps the session XP.
    fireEvent.click(screen.getByRole('button', { name: 'Play Bug Hunt' }))
    expect(screen.getByText('Bug Hunt · 1/5')).toBeInTheDocument()
    expect(screen.getByText('125 XP')).toBeInTheDocument()
  })
})
