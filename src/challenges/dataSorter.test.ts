import { describe, expect, it } from 'vitest'
import { dataSorterChallenges } from '../content/dataSorterChallenges.ts'
import {
  formatList,
  isCorrectAnswer,
  type DataSorterChallenge,
} from './dataSorter.ts'
import { runOps } from './listOps.ts'

const byId = (id: string) => dataSorterChallenges.find((c) => c.id === id)!

describe('Data Sorter validation', () => {
  it('accepts only the correct index for a pick task (zero-based)', () => {
    const indexing = byId('indexing')
    expect(isCorrectAnswer(indexing, { kind: 'pick', index: 2 })).toBe(true)
    // Counting from 1 picks 18 at index 1.
    expect(isCorrectAnswer(indexing, { kind: 'pick', index: 1 })).toBe(false)
  })

  it('accepts only the exact list for a build task, in order', () => {
    const append = byId('append')
    expect(
      isCorrectAnswer(append, { kind: 'build', values: [12, 20, 7, 25] }),
    ).toBe(true)
    expect(
      isCorrectAnswer(append, { kind: 'build', values: [25, 12, 20, 7] }),
    ).toBe(false)
    expect(
      isCorrectAnswer(append, { kind: 'build', values: [12, 20, 7] }),
    ).toBe(false)
  })

  it('rejects an answer of the wrong kind', () => {
    expect(
      isCorrectAnswer(byId('indexing'), { kind: 'build', values: [7] }),
    ).toBe(false)
  })

  it('formats lists like Python prints them', () => {
    expect(formatList([4, 2, 9])).toBe('[4, 2, 9]')
    expect(formatList([])).toBe('[]')
  })
})

describe('Data Sorter content', () => {
  it('has a sequence of 7 challenges with unique ids', () => {
    expect(dataSorterChallenges).toHaveLength(7)
    const ids = dataSorterChallenges.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('mixes pick and build interactions', () => {
    const kinds = new Set(dataSorterChallenges.map((c) => c.task.kind))
    expect(kinds).toEqual(new Set(['pick', 'build']))
  })

  it.each(dataSorterChallenges)(
    '$id has a consistent answer and result',
    (challenge: DataSorterChallenge) => {
      const { task } = challenge

      // The result shown in feedback is what the operations actually produce.
      if (challenge.ops) {
        expect(runOps(challenge.input, challenge.ops)).toEqual(
          challenge.result.values,
        )
      }

      if (task.kind === 'pick') {
        expect(task.answerIndex).toBeGreaterThanOrEqual(0)
        expect(task.answerIndex).toBeLessThan(challenge.input.length)
      } else {
        // Every answer value is available as a tile, often enough times.
        const pool = [...task.pool]
        for (const value of task.answer) {
          const at = pool.indexOf(value)
          expect(at).toBeGreaterThanOrEqual(0)
          pool.splice(at, 1)
        }
        // The pool is shuffled: copying it as-is is not the answer.
        expect(task.pool).not.toEqual(task.answer)
      }
    },
  )

  it('build answers for list operations equal the simulated list', () => {
    for (const challenge of dataSorterChallenges) {
      if (challenge.task.kind === 'build' && challenge.ops) {
        expect(runOps(challenge.input, challenge.ops)).toEqual(
          challenge.task.answer,
        )
      }
    }
  })
})
