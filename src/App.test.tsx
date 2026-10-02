import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

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
})
