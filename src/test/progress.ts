import { screen } from '@testing-library/react'
import { expect } from 'vitest'

const pad = (n: number) => String(n).padStart(2, '0')

/** Asserts the game HUD shows step `step` of `total`, e.g. MODULE 02 / 05. */
export function expectStep(
  name: string,
  step: number,
  total: number,
  unit = 'Module',
) {
  expect(
    screen.getByRole('progressbar', { name: `${name} progress` }),
  ).toHaveAttribute('aria-valuetext', `${unit} ${step} of ${total}`)
  expect(
    screen.getByText(`${unit} ${pad(step)} / ${pad(total)}`),
  ).toBeInTheDocument()
}
