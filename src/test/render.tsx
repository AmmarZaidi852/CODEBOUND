import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { expect } from 'vitest'
import type { Progress } from '../progression/progress.ts'
import ProgressProvider from '../progression/ProgressProvider.tsx'

/** Renders a screen with player progress (fresh unless `initial` is given). */
export function renderWithProgress(ui: ReactElement, initial?: Progress) {
  return render(<ProgressProvider initial={initial}>{ui}</ProgressProvider>)
}

/** The player's total XP shown in the top bar. */
export function expectTotalXp(xp: number) {
  expect(
    screen.getByText(`${xp} XP`, { selector: '.xp-badge__xp' }),
  ).toBeInTheDocument()
}

/** A completion-screen stat tile, e.g. expectStat('Mastered', '4/5'). */
export function expectStat(label: string, value: string) {
  const term = screen.getByText(label, { selector: 'dt' })
  expect(term.nextElementSibling).toHaveTextContent(value)
}
