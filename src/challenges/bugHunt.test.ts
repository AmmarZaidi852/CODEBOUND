import { describe, expect, it } from 'vitest'
import { bugHuntChallenges } from '../content/bugHuntChallenges.ts'
import { getCorrectFix, isCorrectFix } from './bugHunt.ts'

describe('Bug Hunt validation', () => {
  const [first] = bugHuntChallenges

  it('accepts only the correct fix', () => {
    expect(isCorrectFix(first, first.correctFixId)).toBe(true)
    for (const fix of first.fixes) {
      if (fix.id !== first.correctFixId) {
        expect(isCorrectFix(first, fix.id)).toBe(false)
      }
    }
  })

  it('rejects unknown fix ids', () => {
    expect(isCorrectFix(first, 'nope')).toBe(false)
  })
})

describe('Bug Hunt content', () => {
  it('has a sequence of 5 challenges', () => {
    expect(bugHuntChallenges).toHaveLength(5)
  })

  it.each(bugHuntChallenges)(
    '$id has one valid correct fix and explains every wrong one',
    (challenge) => {
      const correct = getCorrectFix(challenge)
      expect(correct.line).toBeGreaterThanOrEqual(1)
      expect(correct.line).toBeLessThanOrEqual(challenge.code.length)

      const ids = challenge.fixes.map((f) => f.id)
      expect(new Set(ids).size).toBe(ids.length)

      for (const fix of challenge.fixes) {
        if (fix.id !== challenge.correctFixId) {
          expect(fix.whyNot).toBeTruthy()
        }
      }
    },
  )
})
