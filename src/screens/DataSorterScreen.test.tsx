import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import { dataSorterChallenges } from '../content/dataSorterChallenges.ts'
import DataSorterScreen from './DataSorterScreen.tsx'
import { expectStep } from '../test/progress.ts'

const byId = (id: string) => dataSorterChallenges.find((c) => c.id === id)!

function cellName(challenge: DataSorterChallenge, index: number) {
  const value = challenge.input[index]
  return challenge.showIndexes ? `Index ${index}: ${value}` : String(value)
}

function addTile(value: number) {
  const tile = screen
    .getAllByRole('button', { name: `Add ${value}` })
    .find((b) => !(b as HTMLButtonElement).disabled)!
  fireEvent.click(tile)
}

/** Answers the current challenge correctly or with a typical mistake, then submits. */
function answer(challenge: DataSorterChallenge, correct: boolean) {
  const { task } = challenge
  if (task.kind === 'pick') {
    const index = correct
      ? task.answerIndex
      : (task.answerIndex + 1) % challenge.input.length
    fireEvent.click(
      screen.getByRole('button', { name: cellName(challenge, index) }),
    )
  } else {
    const values = correct ? task.answer : [...task.answer].reverse()
    values.forEach(addTile)
  }
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
}

function renderGame(challenges?: DataSorterChallenge[]) {
  const onEarnXp = vi.fn()
  const onExit = vi.fn()
  render(
    <DataSorterScreen
      xp={0}
      onEarnXp={onEarnXp}
      onExit={onExit}
      challenges={challenges}
    />,
  )
  return { onEarnXp, onExit }
}

describe('DataSorterScreen', () => {
  it('starts on the first terminal with the list drawn as cells', () => {
    renderGame()
    const first = dataSorterChallenges[0]
    expect(
      screen.getByRole('heading', { level: 1, name: first.name }),
    ).toBeInTheDocument()
    expectStep('Data Sorter', 1, 7)
    for (const value of first.input) {
      expect(
        screen.getByRole('button', { name: String(value) }),
      ).toBeInTheDocument()
    }
  })

  it('shows zero-based index labels and validates an indexing pick', () => {
    const indexing = byId('indexing')
    const { onEarnXp } = renderGame([indexing])

    expect(
      screen.getByRole('button', { name: 'Index 0: 12' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Index 2: 7' }),
    ).toBeInTheDocument()

    answer(indexing, true)
    expect(
      screen.getByRole('heading', { name: 'Data sorted!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(100)
  })

  it('treats a count-from-1 pick as wrong, awards 25 XP, and explains index 0', () => {
    const indexing = byId('indexing')
    const { onEarnXp } = renderGame([indexing])

    fireEvent.click(screen.getByRole('button', { name: 'Index 1: 18' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(
      screen.getByRole('heading', { name: 'Not quite' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(
      screen.getByText(/Python starts at index 0/, { selector: 'p' }),
    ).toBeInTheDocument()
    expect(screen.getByText('What happened')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(25)
  })

  it('requires an answer before submitting', () => {
    renderGame([byId('indexing'), byId('append')])
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Index 3: 21' }))
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
  })

  it('builds a list from tiles: append() result goes on the end', () => {
    const append = byId('append')
    const { onEarnXp } = renderGame([append])
    const target = () => screen.getByRole('group', { name: 'scores' })

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    addTile(12)
    addTile(20)
    expect(screen.getByRole('button', { name: 'Add 12' })).toBeDisabled()
    expect(within(target()).getAllByRole('button')).toHaveLength(2)

    // Tapping a placed value takes it back out; Reset clears everything.
    fireEvent.click(within(target()).getByRole('button', { name: 'Remove 20' }))
    expect(within(target()).getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(within(target()).queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Add 12' })).toBeEnabled()

    answer(append, true)
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledWith(100)
  })

  it('rejects a built list in the wrong order and shows the correct result', () => {
    const append = byId('append')
    const { onEarnXp } = renderGame([append])
    ;[25, 12, 20, 7].forEach(addTile)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    // The last "scores =" list is the correct result shown in feedback.
    const result = screen.getAllByRole('group', { name: 'scores =' }).at(-1)!
    expect(
      within(result)
        .getAllByText(/\d+/)
        .map((el) => Number(el.textContent)),
    ).toEqual([12, 20, 7, 25])
    expect(onEarnXp).toHaveBeenCalledWith(25)
  })

  it('validates pop(): the item at the index is the one removed', () => {
    const pop = byId('pop')
    renderGame([pop])
    fireEvent.click(screen.getByRole('button', { name: 'Index 2: 7' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(
      screen.getAllByRole('group', { name: 'scores =' }).at(-1),
    ).toHaveTextContent('122025')
  })

  it('locks the answer after submitting so XP is awarded only once', () => {
    const { onEarnXp } = renderGame([byId('append'), byId('pop')])
    addTile(12)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    expect(
      screen.queryByRole('button', { name: 'Submit' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add 20' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove 12' })).toBeDisabled()
    expect(onEarnXp).toHaveBeenCalledTimes(1)
  })

  it('moves to the next challenge with a fresh answer', () => {
    renderGame()
    const [first, second] = dataSorterChallenges
    answer(first, true)
    fireEvent.click(screen.getByRole('button', { name: 'Next challenge' }))

    expect(
      screen.getByRole('heading', { level: 1, name: second.name }),
    ).toBeInTheDocument()
    expectStep('Data Sorter', 2, 7)
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
  })

  it('shows a completion summary after the final challenge', () => {
    const { onEarnXp, onExit } = renderGame()

    dataSorterChallenges.forEach((challenge, i) => {
      // Miss the indexing and combined challenges, solve the rest.
      answer(
        challenge,
        challenge.id !== 'indexing' && challenge.id !== 'combined',
      )
      const isLast = i === dataSorterChallenges.length - 1
      fireEvent.click(
        screen.getByRole('button', {
          name: isLast ? 'Finish' : 'Next challenge',
        }),
      )
    })

    expect(
      screen.getByRole('heading', { name: 'All data sorted' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+550')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('5/7')).toBeInTheDocument()
    expect(onEarnXp).toHaveBeenCalledTimes(7)

    fireEvent.click(screen.getByRole('button', { name: 'Back to games' }))
    expect(onExit).toHaveBeenCalled()
  })
})
