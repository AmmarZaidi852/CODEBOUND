import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import { bugHuntChallenges } from '../content/bugHuntChallenges.ts'
import BugHuntScreen from './BugHuntScreen.tsx'
import { expectStep } from '../test/progress.ts'

function fixLabel(challenge: BugHuntChallenge, correct: boolean) {
  const fix = challenge.fixes.find(
    (f) => (f.id === challenge.correctFixId) === correct,
  )!
  return `Line ${fix.line} ${fix.code}`
}

function answer(challenge: BugHuntChallenge, correct: boolean) {
  fireEvent.click(
    screen.getByRole('radio', { name: fixLabel(challenge, correct) }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))
}

function renderGame() {
  const onEarnXp = vi.fn()
  const onExit = vi.fn()
  render(<BugHuntScreen xp={0} onEarnXp={onEarnXp} onExit={onExit} />)
  return { onEarnXp, onExit }
}

describe('BugHuntScreen', () => {
  const [first, second] = bugHuntChallenges

  it('starts on the first challenge with its concept, code, and patch options', () => {
    renderGame()
    expect(
      screen.getByRole('heading', { level: 1, name: first.title }),
    ).toBeInTheDocument()
    expectStep('Bug Hunt', 1, 5)
    expect(screen.getByText(first.concept)).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(first.fixes.length)
  })

  it('requires choosing a patch before submitting', () => {
    renderGame()
    const submit = screen.getByRole('button', { name: 'Apply patch' })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: fixLabel(first, true) }))
    expect(submit).toBeEnabled()
  })

  it('rewards a correct patch with 100 XP and an explanation', () => {
    const { onEarnXp } = renderGame()
    answer(first, true)

    expect(
      screen.getByRole('heading', { name: 'Bug squashed!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(screen.getByText('What was wrong')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(100)
  })

  it('gives 25 XP for a wrong patch and explains why it fails', () => {
    const { onEarnXp } = renderGame()
    answer(first, false)

    expect(
      screen.getByRole('heading', { name: 'Not quite' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    const wrongFix = first.fixes.find((f) => f.id !== first.correctFixId)!
    expect(
      screen.getByText(
        (_, el) => el?.textContent === wrongFix.whyNot!.replaceAll('`', ''),
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('What was wrong')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(25)
  })

  it('locks the answer after submitting', () => {
    const { onEarnXp } = renderGame()
    answer(first, false)

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
    expect(
      screen.queryByRole('button', { name: 'Apply patch' }),
    ).not.toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledTimes(1)
  })

  it('moves to the next challenge', () => {
    renderGame()
    answer(first, true)
    fireEvent.click(screen.getByRole('button', { name: 'Next challenge' }))

    expect(
      screen.getByRole('heading', { level: 1, name: second.title }),
    ).toBeInTheDocument()
    expectStep('Bug Hunt', 2, 5)
    expect(screen.getByRole('button', { name: 'Apply patch' })).toBeDisabled()
  })

  it('shows a completion summary after the final challenge', () => {
    const { onEarnXp, onExit } = renderGame()

    bugHuntChallenges.forEach((challenge, i) => {
      // Miss the second challenge, solve the rest.
      answer(challenge, i !== 1)
      const isLast = i === bugHuntChallenges.length - 1
      fireEvent.click(
        screen.getByRole('button', {
          name: isLast ? 'Finish' : 'Next challenge',
        }),
      )
    })

    expect(
      screen.getByRole('heading', { name: 'All bugs squashed' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+425')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('4/5')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledTimes(5)

    fireEvent.click(screen.getByRole('button', { name: 'Back to games' }))
    expect(onExit).toHaveBeenCalled()
  })
})
