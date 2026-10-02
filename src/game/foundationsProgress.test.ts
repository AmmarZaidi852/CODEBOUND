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
    expect(foundationsProgress(foundations, [])).toEqual({ done: 0, total: 8 })
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
      total: 8,
    })
  })

  it('ends with Functions and has nothing current once all are done', () => {
    const all = foundations.map((c) => c.id)
    expect(nextConcept(foundations, 'functions')).toBeNull()
    expect(currentConcept(foundations, all)).toBeNull()
    expect(foundationsProgress(foundations, all)).toEqual({ done: 8, total: 8 })
  })
})
