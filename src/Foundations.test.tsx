import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import type { Concept } from './challenges/foundations.ts'
import { bugHuntChallenges } from './content/bugHuntChallenges.ts'
import { foundations } from './content/foundations.ts'
import { functionForgeChallenges } from './content/functionForgeChallenges.ts'
import { codeBreakerModules } from './content/gameChallenges.ts'
import { newProgress } from './progression/progress.ts'
import { saveProgress } from './progression/storage.ts'
import { expectStep } from './test/progress.ts'

/** Answers the open concept's micro-challenge correctly. */
function answerConcept(concept: Concept) {
  const { micro } = concept
  if (micro.kind === 'choice') {
    const option = micro.options.find((o) => o.id === micro.correctOptionId)!
    fireEvent.click(screen.getByRole('radio', { name: option.code }))
  } else {
    const value = micro.list.values[micro.answerIndex]
    fireEvent.click(
      screen.getByRole('button', {
        name: `Index ${micro.answerIndex}: ${value}`,
      }),
    )
  }
  fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
}

function openFoundations() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'START LEARNING' }))
}

describe('Python Foundations flow', () => {
  it('shows learning progress on the home screen and opens the path', () => {
    render(<App />)
    expect(
      screen.getByText('Python Foundations · 0/9 concepts'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'START LEARNING' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Python Foundations' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 / 9 concepts completed')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
    expect(
      screen.getByRole('button', { name: 'Start Variables' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Data types is locked' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Functions is locked' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'While loops is locked' }),
    ).toBeDisabled()
  })

  it('completing a concept unlocks the next, updates progress, and awards XP once', () => {
    openFoundations()
    fireEvent.click(screen.getByRole('button', { name: 'Start Variables' }))
    answerConcept(foundations[0])
    expect(screen.getByText('25 XP')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Foundations/ }))
    expect(screen.getByText('1 / 9 concepts completed')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Review Variables' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Start Data types' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Operators is locked' }),
    ).toBeDisabled()

    // Reviewing a completed concept gives no extra XP or progress.
    fireEvent.click(screen.getByRole('button', { name: 'Review Variables' }))
    answerConcept(foundations[0])
    expect(screen.getByText('25 XP')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Foundations/ }))
    expect(screen.getByText('1 / 9 concepts completed')).toBeInTheDocument()

    // Home reflects the progress.
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(
      screen.getByRole('button', { name: 'CONTINUE LEARNING' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Python Foundations · 1/9 concepts'),
    ).toBeInTheDocument()
  })

  it('moves straight on to the next concept', () => {
    openFoundations()
    fireEvent.click(screen.getByRole('button', { name: 'Start Variables' }))
    answerConcept(foundations[0])
    fireEvent.click(
      screen.getByRole('button', { name: 'Next concept: Data types' }),
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Data types' }),
    ).toBeInTheDocument()
    expectStep('Python Foundations', 2, 9, 'Lesson')
  })

  it('launches the linked game from a concept and returns to the path with progress kept', () => {
    openFoundations()
    fireEvent.click(screen.getByRole('button', { name: 'Start Variables' }))
    answerConcept(foundations[0])
    fireEvent.click(
      screen.getByRole('button', { name: 'Practise in Bug Hunt' }),
    )

    // Bug Hunt plays as normal and its XP adds to the same total.
    expectStep('Bug Hunt', 1, 12)
    const bug = bugHuntChallenges[0]
    const fix = bug.fixes.find((f) => f.id === bug.correctFixId)!
    fireEvent.click(
      screen.getByRole('radio', { name: `Line ${fix.line} ${fix.code}` }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Apply patch' }))
    expect(screen.getByText('125 XP')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Foundations/ }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Python Foundations' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 9 concepts completed')).toBeInTheDocument()
    expect(screen.getByText('125 XP')).toBeInTheDocument()
  })

  it('completes all nine concepts, ending with While loops', () => {
    openFoundations()
    fireEvent.click(screen.getByRole('button', { name: 'Start Variables' }))
    foundations.forEach((concept, i) => {
      expect(
        screen.getByRole('heading', { level: 1, name: concept.title }),
      ).toBeInTheDocument()
      answerConcept(concept)
      const next = foundations[i + 1]
      fireEvent.click(
        screen.getByRole('button', {
          name: next ? `Next concept: ${next.title}` : 'Back to Foundations',
        }),
      )
    })

    expect(foundations.at(-1)!.title).toBe('While loops')
    expect(screen.getByText('9 / 9 concepts completed')).toBeInTheDocument()
    expect(screen.getByText(/All foundations complete/)).toBeInTheDocument()
    expect(screen.getByText('225 XP')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(
      screen.getByRole('button', { name: 'REVIEW LEARNING' }),
    ).toBeInTheDocument()
  })

  it('shows what each game teaches on game selection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    const card = (name: string) =>
      screen.getByRole('heading', { name }).closest('li')!

    expect(
      within(card('Bug Hunt')).getByText(/Variables · Data types/),
    ).toBeInTheDocument()
    expect(
      within(card('Code Breaker')).getByText(
        /Operators · Conditions · While loops/,
      ),
    ).toBeInTheDocument()
    expect(
      within(card('Data Sorter')).getByText(/Lists · Indexing · Loops/),
    ).toBeInTheDocument()
    expect(
      within(card('Function Forge')).getByText('Functions', {
        selector: '.game-card__learn',
      }),
    ).toBeInTheDocument()
  })

  it('shows four playable games, each opening from game selection', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    expect(screen.getAllByRole('button', { name: /^Play / })).toHaveLength(4)

    for (const [game, total] of [
      ['Bug Hunt', 12],
      ['Code Breaker', 15],
      ['Data Sorter', 15],
      ['Function Forge', 16],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: `Play ${game}` }))
      expectStep(game, 1, total)
      fireEvent.click(screen.getByRole('button', { name: /Games/ }))
      expect(
        screen.getByRole('heading', { name: 'Choose your game' }),
      ).toBeInTheDocument()
    }
  })

  it('practises Functions in Function Forge and returns to Foundations with progress kept', () => {
    openFoundations()
    fireEvent.click(screen.getByRole('button', { name: 'Start Variables' }))
    // Work through to Functions.
    const at = foundations.findIndex((c) => c.id === 'functions')
    foundations.slice(0, at).forEach((concept, i) => {
      answerConcept(concept)
      fireEvent.click(
        screen.getByRole('button', {
          name: `Next concept: ${foundations[i + 1].title}`,
        }),
      )
    })
    answerConcept(foundations[at])
    expect(screen.getByText('200 XP')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Practise in Function Forge' }),
    )
    expectStep('Function Forge', 1, 16)
    expect(
      screen.getByRole('button', { name: '← Foundations' }),
    ).toBeInTheDocument()

    // Play the first module, then leave.
    for (const token of functionForgeChallenges[0].task.kind === 'assemble'
      ? functionForgeChallenges[0].task.answer
      : []) {
      fireEvent.click(screen.getByRole('button', { name: `Add ${token}` }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Run module' }))
    expect(screen.getByText('300 XP')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '← Foundations' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Python Foundations' }),
    ).toBeInTheDocument()
    expect(screen.getByText('8 / 9 concepts completed')).toBeInTheDocument()
    expect(screen.getByText('300 XP')).toBeInTheDocument()
  })

  it('a player who finished the original eight sees 8/9 and continues with While loops', () => {
    const firstEight = foundations
      .map((c) => c.id)
      .filter((id) => id !== 'while')
    saveProgress({ ...newProgress(), xp: 200, concepts: firstEight })
    render(<App />)
    expect(
      screen.getByText('Python Foundations · 8/9 concepts'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'CONTINUE LEARNING' }))
    expect(screen.getByText('8 / 9 concepts completed')).toBeInTheDocument()
    for (const concept of foundations.slice(0, 8)) {
      expect(
        screen.getByRole('button', { name: `Review ${concept.title}` }),
      ).toBeEnabled()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Start While loops' }))
    expectStep('Python Foundations', 9, 9, 'Lesson')

    // A wrong answer still completes the lesson (after the explanation).
    const { micro } = foundations[8]
    if (micro.kind !== 'choice') throw new Error('expected a choice')
    fireEvent.click(screen.getByRole('radio', { name: '4' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(
      screen.getByText(/so the loop stops before a fourth print/),
    ).toBeInTheDocument()
    expect(screen.getByText('225 XP')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Practise in Code Breaker' }),
    )
    expectStep('Code Breaker', 1, codeBreakerModules.length)
    fireEvent.click(screen.getByRole('button', { name: '← Foundations' }))
    expect(screen.getByText('9 / 9 concepts completed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(
      screen.getByRole('button', { name: 'REVIEW LEARNING' }),
    ).toBeInTheDocument()
  })

  it('still returns to game selection when a game is opened directly', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'PLAY' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play Data Sorter' }))
    fireEvent.click(screen.getByRole('button', { name: /Games/ }))
    expect(
      screen.getByRole('heading', { name: 'Choose your game' }),
    ).toBeInTheDocument()
  })
})
