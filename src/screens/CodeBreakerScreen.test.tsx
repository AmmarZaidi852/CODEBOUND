import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'
import { codeBreakerChallenges } from '../content/codeBreakerChallenges.ts'
import CodeBreakerScreen from './CodeBreakerScreen.tsx'

function option(challenge: CodeBreakerChallenge, correct: boolean) {
  return challenge.options.find(
    (o) => (o.id === challenge.correctOptionId) === correct,
  )!
}

function answer(challenge: CodeBreakerChallenge, correct: boolean) {
  fireEvent.click(
    screen.getByRole('radio', { name: option(challenge, correct).code }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Attempt unlock' }))
}

function renderGame() {
  const onEarnXp = vi.fn()
  const onExit = vi.fn()
  render(<CodeBreakerScreen xp={0} onEarnXp={onEarnXp} onExit={onExit} />)
  return { onEarnXp, onExit }
}

describe('CodeBreakerScreen', () => {
  const [first, second] = codeBreakerChallenges

  it('starts on the first lock with its rule, system state, and options', () => {
    renderGame()
    expect(
      screen.getByRole('heading', { level: 1, name: first.system }),
    ).toBeInTheDocument()
    expect(screen.getByText('Code Breaker · 1/5')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Locked')
    expect(screen.getByText(first.rule)).toBeInTheDocument()
    expect(screen.getByText(first.state[0].name)).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(first.options.length)
  })

  it('requires choosing an option before attempting the unlock', () => {
    renderGame()
    const submit = screen.getByRole('button', { name: 'Attempt unlock' })
    expect(submit).toBeDisabled()
    fireEvent.click(
      screen.getByRole('radio', { name: option(first, true).code }),
    )
    expect(submit).toBeEnabled()
  })

  it('slots the selected condition into the lock code', () => {
    const { container } = render(
      <CodeBreakerScreen xp={0} onEarnXp={() => {}} onExit={() => {}} />,
    )
    const slot = () => container.querySelector('.code-block__slot')
    expect(slot()).toHaveTextContent('____')

    const wrong = option(first, false)
    fireEvent.click(screen.getByRole('radio', { name: wrong.code }))
    expect(slot()).toHaveTextContent(wrong.code)
  })

  it('rewards a correct answer with 100 XP, unlocks, and explains the logic', () => {
    const { onEarnXp } = renderGame()
    answer(first, true)

    expect(
      screen.getByRole('heading', { name: 'Lock broken!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Unlocked')
    expect(screen.getByText('How it evaluates')).toBeInTheDocument()
    expect(screen.getByText('Takeaway')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(100)
  })

  it('gives 25 XP for a wrong answer, explains why it fails, and shows the correct logic', () => {
    const { onEarnXp } = renderGame()
    answer(first, false)

    expect(
      screen.getByRole('heading', { name: 'Access denied' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Still locked')
    const whyNot = option(first, false).whyNot!.replaceAll('`', '')
    expect(
      screen.getByText((_, el) => el?.textContent === whyNot),
    ).toBeInTheDocument()
    expect(screen.getByText('Correct logic')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(25)
  })

  it('cannot be submitted again for extra XP', () => {
    const { onEarnXp } = renderGame()
    answer(first, false)

    expect(
      screen.queryByRole('button', { name: 'Attempt unlock' }),
    ).not.toBeInTheDocument()
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
    fireEvent.click(
      screen.getByRole('radio', { name: option(first, true).code }),
    )
    expect(onEarnXp).toHaveBeenCalledTimes(1)
  })

  it('continues to the next lock', () => {
    renderGame()
    answer(first, true)
    fireEvent.click(screen.getByRole('button', { name: 'Next challenge' }))

    expect(
      screen.getByRole('heading', { level: 1, name: second.system }),
    ).toBeInTheDocument()
    expect(screen.getByText('Code Breaker · 2/5')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Locked')
    expect(
      screen.getByRole('button', { name: 'Attempt unlock' }),
    ).toBeDisabled()
  })

  it('shows a completion summary after the final lock', () => {
    const { onEarnXp, onExit } = renderGame()

    codeBreakerChallenges.forEach((challenge, i) => {
      // Miss the third and fifth locks, solve the rest.
      answer(challenge, i !== 2 && i !== 4)
      const isLast = i === codeBreakerChallenges.length - 1
      fireEvent.click(
        screen.getByRole('button', {
          name: isLast ? 'Finish' : 'Next challenge',
        }),
      )
    })

    expect(
      screen.getByRole('heading', { name: 'All locks broken' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+350')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledTimes(5)

    fireEvent.click(screen.getByRole('button', { name: 'Back to games' }))
    expect(onExit).toHaveBeenCalled()
  })
})
