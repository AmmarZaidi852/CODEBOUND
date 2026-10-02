import { describe, expect, it } from 'vitest'
import { codeBreakerChallenges } from '../content/codeBreakerChallenges.ts'
import {
  CODE_SLOT,
  getCorrectOption,
  hasCodeSlot,
  isCorrectOption,
} from './codeBreaker.ts'

describe('Code Breaker validation', () => {
  const [first] = codeBreakerChallenges

  it('accepts only the correct option', () => {
    expect(isCorrectOption(first, first.correctOptionId)).toBe(true)
    for (const option of first.options) {
      if (option.id !== first.correctOptionId) {
        expect(isCorrectOption(first, option.id)).toBe(false)
      }
    }
  })

  it('rejects unknown option ids', () => {
    expect(isCorrectOption(first, 'nope')).toBe(false)
  })

  it('detects whether the answer fills a code slot', () => {
    const slotted = codeBreakerChallenges.find((c) => c.id === 'basic-if')!
    const predict = codeBreakerChallenges.find((c) => c.id === 'if-elif-else')!
    expect(hasCodeSlot(slotted)).toBe(true)
    expect(hasCodeSlot(predict)).toBe(false)
  })
})

describe('Code Breaker content', () => {
  it('has a sequence of 5 locks', () => {
    expect(codeBreakerChallenges).toHaveLength(5)
  })

  it('has unique challenge ids', () => {
    const ids = codeBreakerChallenges.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(codeBreakerChallenges)(
    '$id has one valid correct option and explains every wrong one',
    (challenge) => {
      expect(getCorrectOption(challenge)).toBeDefined()

      const ids = challenge.options.map((o) => o.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(challenge.options.length).toBeGreaterThanOrEqual(3)

      for (const option of challenge.options) {
        if (option.id !== challenge.correctOptionId) {
          expect(option.whyNot).toBeTruthy()
        }
      }

      const slots = challenge.code.join('\n').split(CODE_SLOT).length - 1
      expect(slots).toBeLessThanOrEqual(1)
    },
  )
})
