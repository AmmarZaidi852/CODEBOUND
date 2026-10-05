import { describe, expect, it } from 'vitest'
import type { ConceptId } from '../challenges/foundations.ts'
import { foundations } from '../content/foundations.ts'
import {
  currentConcept,
  foundationsProgress,
  isConceptUnlocked,
  nextConcept,
} from './foundationsProgress.ts'

describe('foundations progression', () => {
  it('starts with only Variables unlocked and current', () => {
    expect(isConceptUnlocked(foundations, [], 'variables')).toBe(true)
    expect(isConceptUnlocked(foundations, [], 'data-types')).toBe(false)
    expect(isConceptUnlocked(foundations, [], 'functions')).toBe(false)
    expect(currentConcept(foundations, [])?.id).toBe('variables')
    expect(foundationsProgress(foundations, [])).toEqual({ done: 0, total: 9 })
  })

  it('unlocks the next concept when one is completed', () => {
    const completed: ConceptId[] = ['variables']
    expect(isConceptUnlocked(foundations, completed, 'data-types')).toBe(true)
    expect(isConceptUnlocked(foundations, completed, 'operators')).toBe(false)
    expect(currentConcept(foundations, completed)?.id).toBe('data-types')
    expect(foundationsProgress(foundations, completed).done).toBe(1)
  })

  it('keeps completed concepts open and reports the next one', () => {
    const completed: ConceptId[] = ['variables', 'data-types', 'operators']
    expect(isConceptUnlocked(foundations, completed, 'variables')).toBe(true)
    expect(isConceptUnlocked(foundations, completed, 'conditions')).toBe(true)
    expect(nextConcept(foundations, 'operators')?.id).toBe('conditions')
    expect(foundationsProgress(foundations, completed)).toEqual({
      done: 3,
      total: 9,
    })
  })

  it('opens While loops after Functions, and only then', () => {
    const firstEight = foundations
      .map((c) => c.id)
      .filter((id) => id !== 'while')
    expect(
      isConceptUnlocked(foundations, firstEight.slice(0, 7), 'while'),
    ).toBe(false)
    expect(isConceptUnlocked(foundations, firstEight, 'while')).toBe(true)
    expect(nextConcept(foundations, 'functions')?.id).toBe('while')
    // A player who finished the original eight: still 8 done, While is next.
    expect(currentConcept(foundations, firstEight)?.id).toBe('while')
    expect(foundationsProgress(foundations, firstEight)).toEqual({
      done: 8,
      total: 9,
    })
    for (const id of firstEight) {
      expect(isConceptUnlocked(foundations, firstEight, id)).toBe(true)
    }
  })

  it('ends with While loops and has nothing current once all are done', () => {
    const all = foundations.map((c) => c.id)
    expect(nextConcept(foundations, 'while')).toBeNull()
    expect(currentConcept(foundations, all)).toBeNull()
    expect(foundationsProgress(foundations, all)).toEqual({ done: 9, total: 9 })
  })
})
