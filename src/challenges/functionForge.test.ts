import { describe, expect, it } from 'vitest'
import { functionForgeChallenges } from '../content/functionForgeChallenges.ts'
import {
  correctForgeCode,
  fillSlot,
  FORGE_SLOT,
  formatTokens,
  isCorrectForgeAnswer,
  type FunctionForgeChallenge,
} from './functionForge.ts'

const byId = (id: string) => functionForgeChallenges.find((c) => c.id === id)!

describe('formatTokens', () => {
  it('formats a function header', () => {
    expect(formatTokens(['def', 'greet', '(', ')', ':'])).toBe('def greet():')
  })

  it('formats parameters and moves the body onto an indented line', () => {
    expect(
      formatTokens([
        'def',
        'area',
        '(',
        'w',
        ',',
        'h',
        ')',
        ':',
        'return',
        'w * h',
      ]),
    ).toBe('def area(w, h):\n    return w * h')
  })

  it('fills the slot, splitting multi-line values', () => {
    expect(fillSlot(['____'], 'def f():\n    return 1')).toEqual([
      'def f():',
      '    return 1',
    ])
    expect(fillSlot(['greet(____)'], '"Alex"')).toEqual(['greet("Alex")'])
  })
})

describe('Function Forge validation', () => {
  it('accepts the correct function structure and rejects a wrong order', () => {
    const define = byId('define')
    expect(
      isCorrectForgeAnswer(define, {
        kind: 'assemble',
        tokens: ['def', 'greet', '(', ')', ':'],
      }),
    ).toBe(true)
    expect(
      isCorrectForgeAnswer(define, {
        kind: 'assemble',
        tokens: ['greet', 'def', '(', ')', ':'],
      }),
    ).toBe(false)
  })

  it('rejects an incomplete function body', () => {
    const build = byId('build')
    const header = ['def', 'area', '(', 'w', ',', 'h', ')', ':']
    expect(
      isCorrectForgeAnswer(build, {
        kind: 'assemble',
        tokens: [...header, 'return', 'w + h'],
      }),
    ).toBe(false)
    expect(
      isCorrectForgeAnswer(build, {
        kind: 'assemble',
        tokens: [...header, 'return', 'w * h'],
      }),
    ).toBe(true)
  })

  it('validates arguments in order', () => {
    const multi = byId('multiple-parameters')
    expect(
      isCorrectForgeAnswer(multi, { kind: 'args', args: ['10', '3'] }),
    ).toBe(true)
    expect(
      isCorrectForgeAnswer(multi, { kind: 'args', args: ['3', '10'] }),
    ).toBe(false)
  })

  it('validates a function call choice and a predicted output', () => {
    const call = byId('call')
    expect(isCorrectForgeAnswer(call, { kind: 'choose', optionId: 'b' })).toBe(
      true,
    )
    expect(isCorrectForgeAnswer(call, { kind: 'choose', optionId: 'a' })).toBe(
      false,
    )
    expect(correctForgeCode(call)).toBe('greet()')
    expect(correctForgeCode(byId('predict'))).toBe('14')
  })

  it('rejects an answer of the wrong kind', () => {
    expect(
      isCorrectForgeAnswer(byId('call'), { kind: 'args', args: ['greet'] }),
    ).toBe(false)
  })

  it('shows what a wrong argument actually produces', () => {
    const [run] = [byId('multiple-parameters').task]
    if (run.kind !== 'args') throw new Error('expected args task')
    expect(run.run(['3', '10'])).toBe('-7')
    const greet = byId('one-parameter').task
    if (greet.kind !== 'args') throw new Error('expected args task')
    expect(greet.run(['Alex'])).toMatch(/NameError/)
    expect(greet.run(['"Hello"'])).toBe('Hello Hello')
  })
})

describe('Function Forge content', () => {
  it('has 7 challenges with unique ids', () => {
    expect(functionForgeChallenges).toHaveLength(7)
    const ids = functionForgeChallenges.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses all three interaction kinds, not only multiple choice', () => {
    const kinds = functionForgeChallenges.map((c) => c.task.kind)
    expect(new Set(kinds)).toEqual(new Set(['assemble', 'choose', 'args']))
    expect(kinds.filter((k) => k === 'choose').length).toBeLessThan(
      kinds.length / 2,
    )
  })

  it.each(functionForgeChallenges)(
    '$id is internally consistent',
    (challenge: FunctionForgeChallenge) => {
      expect(challenge.title).toBeTruthy()
      expect(challenge.lesson).toBeTruthy()
      expect(challenge.instruction).toBeTruthy()
      expect(challenge.explanation.steps).toBeTruthy()
      expect(challenge.explanation.concept).toBeTruthy()

      const slots = challenge.code.join('\n').split(FORGE_SLOT).length - 1
      expect(slots).toBeLessThanOrEqual(1)

      const { task } = challenge
      if (task.kind === 'assemble') {
        // Every answer token is available, each used once.
        const pool = [...task.tokens]
        for (const token of task.answer) {
          const at = pool.indexOf(token)
          expect(at).toBeGreaterThanOrEqual(0)
          pool.splice(at, 1)
        }
        expect(pool.length).toBeGreaterThan(0) // has distractors
        expect(challenge.explanation.mistake).toBeTruthy()
        expect(slots).toBe(1)
      } else if (task.kind === 'choose') {
        const ids = task.options.map((o) => o.id)
        expect(new Set(ids).size).toBe(ids.length)
        expect(ids).toContain(task.correctOptionId)
        for (const option of task.options) {
          if (option.id !== task.correctOptionId) {
            expect(option.whyNot).toBeTruthy()
          }
        }
      } else {
        expect(task.answer).toHaveLength(task.params.length)
        for (const arg of task.answer) expect(task.tiles).toContain(arg)
        // The expected arguments really produce the target output…
        expect(task.run(task.answer)).toBe(task.target)
        // …and match the call shown in the pipeline.
        expect(challenge.call?.args).toEqual(task.answer)
        expect(challenge.call?.output).toBe(task.target)
        expect(challenge.explanation.mistake).toBeTruthy()
        expect(slots).toBe(1)
      }
    },
  )

  it('has exactly one argument combination that hits each target', () => {
    for (const challenge of functionForgeChallenges) {
      const { task } = challenge
      if (task.kind !== 'args') continue
      const combos =
        task.params.length === 1
          ? task.tiles.map((t) => [t])
          : task.tiles.flatMap((a) =>
              task.tiles.filter((b) => b !== a).map((b) => [a, b]),
            )
      const hits = combos.filter((args) => task.run(args) === task.target)
      expect(hits).toEqual([task.answer])
    }
  })
})
