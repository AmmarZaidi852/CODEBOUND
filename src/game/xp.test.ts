import { describe, expect, it } from 'vitest'
import { levelForXp, levelProgress, xpForResult } from './xp.ts'

describe('xp', () => {
  it('awards 100 XP for a correct answer and 25 XP for an incorrect one', () => {
    expect(xpForResult(true)).toBe(100)
    expect(xpForResult(false)).toBe(25)
  })

  it('starts at level 1 and levels up every 300 XP', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(299)).toBe(1)
    expect(levelForXp(300)).toBe(2)
    expect(levelForXp(725)).toBe(3)
  })

  it('reports progress through the current level', () => {
    expect(levelProgress(0)).toBe(0)
    expect(levelProgress(150)).toBe(0.5)
    expect(levelProgress(300)).toBe(0)
  })
})
