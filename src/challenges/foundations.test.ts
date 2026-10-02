import { describe, expect, it } from 'vitest'
import { foundations } from '../content/foundations.ts'
import { games } from '../content/games.ts'
import {
  correctAnswerText,
  isCorrectMicro,
  type Concept,
  type ConceptId,
} from './foundations.ts'

const byId = (id: ConceptId) => foundations.find((c) => c.id === id)!

describe('Python Foundations content', () => {
  it('has the 8 concepts in learning order', () => {
    expect(foundations.map((c) => c.id)).toEqual([
      'variables',
      'data-types',
      'operators',
      'conditions',
      'lists',
      'indexing',
      'loops',
      'functions',
    ])
  })

  it.each(foundations)(
    '$id has a summary, example, micro-challenge, and explanation',
    (concept: Concept) => {
      expect(concept.title).toBeTruthy()
      expect(concept.summary).toBeTruthy()
      expect(concept.example.length).toBeGreaterThan(0)
      expect(concept.exampleNote).toBeTruthy()
      expect(concept.micro.prompt).toBeTruthy()
      expect(concept.explanation).toBeTruthy()

      const { micro } = concept
      if (micro.kind === 'choice') {
        const ids = micro.options.map((o) => o.id)
        expect(new Set(ids).size).toBe(ids.length)
        expect(ids).toContain(micro.correctOptionId)
        for (const option of micro.options) {
          if (option.id !== micro.correctOptionId) {
            expect(option.whyNot).toBeTruthy()
          }
        }
      } else {
        expect(micro.answerIndex).toBeGreaterThanOrEqual(0)
        expect(micro.answerIndex).toBeLessThan(micro.list.values.length)
        expect(micro.whyNot).toBeTruthy()
      }
    },
  )

  it('links every concept to a playable game', () => {
    const playable = games.filter((g) => g.playable).map((g) => g.id)
    for (const concept of foundations) {
      expect(playable).toContain(concept.game)
    }
    expect(byId('variables').game).toBe('bug-hunt')
    expect(byId('conditions').game).toBe('code-breaker')
    expect(byId('indexing').game).toBe('data-sorter')
    expect(byId('functions').game).toBe('function-forge')
  })

  it('gives every playable game at least one concept', () => {
    for (const game of games.filter((g) => g.playable)) {
      expect(foundations.some((c) => c.game === game.id)).toBe(true)
    }
  })
})

describe('micro-challenge validation', () => {
  it('validates a choice answer', () => {
    const functions = byId('functions')
    expect(
      isCorrectMicro(functions.micro, { kind: 'choice', optionId: 'a' }),
    ).toBe(true)
    expect(
      isCorrectMicro(functions.micro, { kind: 'choice', optionId: 'b' }),
    ).toBe(false)
    expect(correctAnswerText(functions.micro)).toBe('5')
  })

  it('validates a pick answer by zero-based index', () => {
    const indexing = byId('indexing')
    expect(isCorrectMicro(indexing.micro, { kind: 'pick', index: 1 })).toBe(
      true,
    )
    expect(isCorrectMicro(indexing.micro, { kind: 'pick', index: 0 })).toBe(
      false,
    )
    expect(correctAnswerText(indexing.micro)).toBe('10 (index 1)')
  })

  it('rejects an answer of the wrong kind', () => {
    expect(
      isCorrectMicro(byId('indexing').micro, { kind: 'choice', optionId: 'a' }),
    ).toBe(false)
  })
})
