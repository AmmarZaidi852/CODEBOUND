import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'
import { functionForgeChallenges } from '../content/functionForgeChallenges.ts'
import FunctionForgeScreen from './FunctionForgeScreen.tsx'
import { expectStep } from '../test/progress.ts'

const byId = (id: string) => functionForgeChallenges.find((c) => c.id === id)!

function addToken(token: string) {
  const button = screen
    .getAllByRole('button', { name: `Add ${token}` })
    .find((b) => !(b as HTMLButtonElement).disabled)!
  fireEvent.click(button)
}

/** Answers the current module correctly or with a typical mistake, then runs it. */
function answer(challenge: FunctionForgeChallenge, correct: boolean) {
  const { task } = challenge
  if (task.kind === 'assemble') {
    const tokens = correct ? task.answer : [...task.answer].reverse()
    tokens.forEach(addToken)
  } else if (task.kind === 'choose') {
    const option = task.options.find(
      (o) => (o.id === task.correctOptionId) === correct,
    )!
    fireEvent.click(screen.getByRole('radio', { name: option.code }))
  } else {
    const args = correct
      ? task.answer
      : task.tiles
          .filter((t) => !task.answer.includes(t))
          .slice(0, task.answer.length)
    for (const arg of args) {
      fireEvent.click(screen.getByRole('button', { name: `Pass ${arg}` }))
    }
  }
  fireEvent.click(screen.getByRole('button', { name: 'Run module' }))
}

function renderGame(challenges?: FunctionForgeChallenge[]) {
  const onEarnXp = vi.fn()
  const onExit = vi.fn()
  render(
    <FunctionForgeScreen
      xp={0}
      onEarnXp={onEarnXp}
      onExit={onExit}
      challenges={challenges}
    />,
  )
  return { onEarnXp, onExit }
}

describe('FunctionForgeScreen', () => {
  it('opens on the first module with a ready status', () => {
    renderGame()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Define It' }),
    ).toBeInTheDocument()
    expectStep('Function Forge', 1, 7)
    expect(screen.getByRole('status')).toHaveTextContent('Ready')
    expect(screen.getByRole('button', { name: 'Run module' })).toBeDisabled()
  })

  it('assembles a function header from tokens, with live code and undo', () => {
    const { onEarnXp } = renderGame([byId('define')])
    const built = () => screen.getByRole('group', { name: 'Your code' })

    addToken('def')
    addToken('greet')
    expect(screen.getByRole('button', { name: 'Add def' })).toBeDisabled()
    expect(screen.getByText('def greet')).toBeInTheDocument()

    fireEvent.click(
      within(built()).getByRole('button', { name: 'Remove greet' }),
    )
    expect(within(built()).getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(within(built()).queryAllByRole('button')).toHaveLength(0)

    answer(byId('define'), true)
    expect(
      screen.getByText('def greet():', { selector: '.code-block__line code' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Module online!' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Online')
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(100)
  })

  it('fails a wrongly ordered build with 25 XP and shows the correct code', () => {
    const { onEarnXp } = renderGame([byId('define')])
    answer(byId('define'), false)

    expect(
      screen.getByRole('heading', { name: 'Module fault' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Fault')
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(
      screen.getByText('def greet():', { selector: '.feedback__fix-code' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/A header is always/)).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(25)
  })

  it('passes arguments into slots in order and shows what the call returned', () => {
    const multi = byId('multiple-parameters')
    const { onEarnXp } = renderGame([multi])
    const call = () => screen.getByRole('group', { name: 'Call' })

    fireEvent.click(screen.getByRole('button', { name: 'Pass 3' }))
    expect(
      within(call()).getByRole('button', { name: 'a: 3, tap to clear' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run module' })).toBeDisabled()

    // Clearing a slot frees it again.
    fireEvent.click(
      within(call()).getByRole('button', { name: 'a: 3, tap to clear' }),
    )
    expect(
      within(call()).getByRole('button', { name: 'a: empty' }),
    ).toBeDisabled()

    // Wrong order: subtract(3, 10) runs and returns -7.
    fireEvent.click(screen.getByRole('button', { name: 'Pass 3' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pass 10' }))
    expect(screen.getByRole('button', { name: 'Pass 7' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Run module' }))

    expect(
      screen.getByRole('heading', { name: 'Module fault' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('figure', { name: /subtract pipeline: 3, 10 → -7/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('subtract(10, 3)', { selector: '.feedback__fix-code' }),
    ).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(25)
  })

  it('accepts the right argument and outputs the target', () => {
    const one = byId('one-parameter')
    renderGame([one])
    answer(one, true)
    expect(
      screen.getByRole('figure', {
        name: /greet pipeline: "Alex" → Hello Alex/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
  })

  it('slots a chosen call into the code and hides the output until it runs', () => {
    const call = byId('call')
    renderGame([call])
    expect(
      screen.getByRole('figure', { name: /greet pipeline: no inputs → \?/ }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'greet()' }))
    answer(call, true)
    expect(
      screen.getByRole('figure', { name: /greet pipeline: no inputs → Hello/ }),
    ).toBeInTheDocument()
  })

  it('explains a wrong prediction', () => {
    const predict = byId('predict')
    renderGame([predict])
    fireEvent.click(screen.getByRole('radio', { name: '49' }))
    fireEvent.click(screen.getByRole('button', { name: 'Run module' }))
    expect(screen.getByText(/49 would be/)).toBeInTheDocument()
    expect(
      screen.getByText('14', { selector: '.feedback__fix-code' }),
    ).toBeInTheDocument()
  })

  it('locks the module after running so XP is awarded only once', () => {
    const { onEarnXp } = renderGame([byId('build'), byId('define')])
    addToken('def')
    fireEvent.click(screen.getByRole('button', { name: 'Run module' }))

    expect(
      screen.queryByRole('button', { name: 'Run module' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add area' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove def' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(onEarnXp).toHaveBeenCalledTimes(1)
  })

  it('moves through modules in order and finishes with a summary', () => {
    const { onEarnXp, onExit } = renderGame()

    functionForgeChallenges.forEach((challenge, i) => {
      expectStep('Function Forge', i + 1, 7)
      // Miss the call and multiple-parameter modules, solve the rest.
      answer(
        challenge,
        challenge.id !== 'call' && challenge.id !== 'multiple-parameters',
      )
      const isLast = i === functionForgeChallenges.length - 1
      fireEvent.click(
        screen.getByRole('button', {
          name: isLast ? 'Finish' : 'Next challenge',
        }),
      )
    })

    expect(
      screen.getByRole('heading', { name: 'All modules online' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+550')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('5/7')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledTimes(7)

    fireEvent.click(screen.getByRole('button', { name: 'Back to games' }))
    expect(onExit).toHaveBeenCalled()
  })
})
