import { describe, expect, it } from 'vitest'
import { applyOp, runOps } from './listOps.ts'

describe('list operations', () => {
  it('set replaces the item at an index without changing the length', () => {
    expect(
      applyOp([12, 18, 7], { op: 'set', index: 1, value: 20 }).list,
    ).toEqual([12, 20, 7])
  })

  it('append adds an item to the end', () => {
    expect(applyOp([12, 20, 7], { op: 'append', value: 25 }).list).toEqual([
      12, 20, 7, 25,
    ])
  })

  it('pop(i) removes and returns the item at index i', () => {
    const { list, removed } = applyOp([12, 20, 7, 25], { op: 'pop', index: 2 })
    expect(removed).toBe(7)
    expect(list).toEqual([12, 20, 25])
  })

  it('pop() with no index removes the last item', () => {
    const { list, removed } = applyOp([4, 7, 2], { op: 'pop' })
    expect(removed).toBe(2)
    expect(list).toEqual([4, 7])
  })

  it('does not mutate the original list', () => {
    const original = [1, 2, 3]
    applyOp(original, { op: 'pop', index: 0 })
    expect(original).toEqual([1, 2, 3])
  })

  it('rejects out-of-range indexes like Python', () => {
    expect(() => applyOp([1, 2], { op: 'pop', index: 2 })).toThrow(/IndexError/)
    expect(() => applyOp([1, 2], { op: 'set', index: -1, value: 0 })).toThrow(
      /IndexError/,
    )
  })

  it('runs operations in order', () => {
    expect(
      runOps(
        [4, 7, 2],
        [
          { op: 'append', value: 9 },
          { op: 'pop', index: 1 },
        ],
      ),
    ).toEqual([4, 2, 9])
  })
})
