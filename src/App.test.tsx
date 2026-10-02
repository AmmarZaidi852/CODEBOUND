import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('renders the CODEBOUND title screen', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'CODEBOUND' }),
    ).toBeInTheDocument()
  })
})
