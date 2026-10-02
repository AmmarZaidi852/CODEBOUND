import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { bugHuntChallenges } from './content/bugHuntChallenges.ts'

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

  it('opens game selection from PLAY with Bug Hunt playable and the rest locked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))

    expect(
      screen.getByRole('heading', { name: 'Choose your game' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play Bug Hunt' })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Code Breaker is locked' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Data Sorter is locked' }),
    ).toBeDisabled()
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
})
