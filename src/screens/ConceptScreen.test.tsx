import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Concept, ConceptId } from '../challenges/foundations.ts'
import { foundations } from '../content/foundations.ts'
import { renderWithProgress } from '../test/render.tsx'
import ConceptScreen from './ConceptScreen.tsx'

const byId = (id: ConceptId) => foundations.find((c) => c.id === id)!

function renderConcept(
  concept: Concept,
  { alreadyCompleted = false, nextTitle = 'Next one' as string | null } = {},
) {
  const handlers = {
    onComplete: vi.fn(),
    onBack: vi.fn(),
    onPractise: vi.fn(),
    onNext: vi.fn(),
  }
  renderWithProgress(
    <ConceptScreen
      concept={concept}
      index={foundations.indexOf(concept)}
      total={foundations.length}
      alreadyCompleted={alreadyCompleted}
      nextTitle={nextTitle}
      {...handlers}
    />,
  )
  return handlers
}

function chooseOption(concept: Concept, correct: boolean) {
  const { micro } = concept
  if (micro.kind !== 'choice') throw new Error('expected a choice micro')
  const option = micro.options.find(
    (o) => (o.id === micro.correctOptionId) === correct,
  )!
  fireEvent.click(screen.getByRole('radio', { name: option.code }))
  return option
}

describe('ConceptScreen', () => {
  const variables = byId('variables')

  it('shows the concept, a tiny example, and a micro-challenge', () => {
    renderConcept(variables)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Variables' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Training module 01')).toBeInTheDocument()
    expect(screen.getByText('score = 100')).toBeInTheDocument()
    expect(
      screen.getByText('What does this example print?'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled()
  })

  it('confirms a correct answer, awards concept XP, and completes once', () => {
    const { onComplete } = renderConcept(variables)
    chooseOption(variables, true)
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(screen.getByRole('heading', { name: 'Got it!' })).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(screen.getByText('Why')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)

    // The answer is locked: no second check.
    expect(
      screen.queryByRole('button', { name: 'Check answer' }),
    ).not.toBeInTheDocument()
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })

  it('explains a wrong answer and shows the correct one', () => {
    renderConcept(variables)
    const wrong = chooseOption(variables, false)
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(
      screen.getByRole('heading', { name: 'Not quite' }),
    ).toBeInTheDocument()
    const whyNot = wrong.whyNot!.replaceAll('`', '')
    expect(
      screen.getByText((_, el) => el?.textContent === whyNot),
    ).toBeInTheDocument()
    expect(
      screen.getByText('150', { selector: '.feedback__fix-code' }),
    ).toBeInTheDocument()
  })

  it('gives no XP when reviewing a completed concept', () => {
    renderConcept(variables, { alreadyCompleted: true })
    chooseOption(variables, true)
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(screen.getByRole('heading', { name: 'Got it!' })).toBeInTheDocument()
    expect(screen.queryByText(/XP$/, { selector: '.feedback__xp' })).toBeNull()
  })

  it('validates the indexing micro-challenge by tapping a list cell', () => {
    const indexing = byId('indexing')
    renderConcept(indexing)
    fireEvent.click(screen.getByRole('button', { name: 'Index 0: 5' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(
      screen.getByRole('heading', { name: 'Not quite' }),
    ).toBeInTheDocument()
    expect(screen.getByText('10 (index 1)')).toBeInTheDocument()
  })

  it('offers practice in the linked game and the next concept', () => {
    const { onPractise, onNext } = renderConcept(variables, {
      nextTitle: 'Data types',
    })
    chooseOption(variables, true)
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    fireEvent.click(
      screen.getByRole('button', { name: 'Practise in Bug Hunt' }),
    )
    expect(onPractise).toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', { name: 'Next concept: Data types' }),
    )
    expect(onNext).toHaveBeenCalled()
  })

  it('ends Functions with a micro-challenge and practice in Function Forge', () => {
    const functions = byId('functions')
    renderConcept(functions, { nextTitle: null })
    expect(screen.getByText(/What does/)).toHaveTextContent(
      'What does add(2, 3) return?',
    )
    chooseOption(functions, true)
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(screen.getByRole('heading', { name: 'Got it!' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Practise in Function Forge' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Back to Foundations' }),
    ).toBeInTheDocument()
  })
})
