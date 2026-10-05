import { describe, expect, it } from 'vitest'
import { checkCode, type CodeChallenge } from '../challenges/code.ts'
import {
  CODE_SLOT,
  getCorrectOption,
  type CodeBreakerChallenge,
} from '../challenges/codeBreaker.ts'
import { interactionOf, type GameModule } from '../challenges/interaction.ts'
import { tierOf } from '../challenges/meta.ts'
import { runProgram } from '../python/interpreter.ts'
import { arcadeModules } from './arcade.ts'
import { foundations } from './foundations.ts'
import { codeBreakerModules, gameModules } from './gameChallenges.ts'
import {
  countdownLock,
  retryLimit,
  stuckLoop,
  whileModules,
} from './whileChallenges.ts'

const code = (...lines: string[]) => lines.join('\n')
const check = (c: CodeChallenge, ...lines: string[]) =>
  checkCode(c, code(...lines))

/** Runs a Code Breaker program with its ____ slot filled in. */
const filled = (c: CodeBreakerChallenge, condition: string) =>
  runProgram(c.code.map((l) => l.replace(CODE_SLOT, condition)).join('\n'))

describe('while modules: metadata and placement', () => {
  it('adds exactly Countdown Lock, Retry Limit and Stuck Loop to Code Breaker', () => {
    expect(whileModules.map((m) => m.id)).toEqual([
      'countdown-lock',
      'retry-limit',
      'stuck-loop',
    ])
    expect(codeBreakerModules).toHaveLength(15)
    for (const m of whileModules) expect(codeBreakerModules).toContain(m)
    for (const [game, modules] of Object.entries(gameModules)) {
      if (game === 'code-breaker') continue
      for (const m of whileModules) expect(modules).not.toContain(m)
    }
  })

  it('are ADVANCED, after the existing advanced modules and before the boss', () => {
    const tiers = codeBreakerModules.map(tierOf)
    const at = codeBreakerModules.indexOf(countdownLock)
    expect(codeBreakerModules.slice(at, at + 3)).toEqual(whileModules)
    expect(tiers.slice(at, at + 3)).toEqual([
      'advanced',
      'advanced',
      'advanced',
    ])
    expect(tiers[at - 1]).toBe('advanced')
    expect(tiers[at + 3]).toBe('boss')
    expect(tiers.filter((t) => t === 'core')).toHaveLength(7)
    expect(tiers.filter((t) => t === 'advanced')).toHaveLength(7)
  })

  it('the new ids are used nowhere else in CODEBOUND', () => {
    const others = [
      ...Object.values(gameModules).flatMap((ms) =>
        (ms as GameModule[]).filter((m) => !whileModules.includes(m as never)),
      ),
      ...arcadeModules.map((r) => r.module),
    ].map((m) => m.id)
    for (const m of whileModules) expect(others).not.toContain(m.id)
  })

  it('each uses while plus at least one other concept, and nothing beyond Code Breaker and Bug Hunt basics', () => {
    const allowed = new Set(['while', 'operators', 'conditions', 'variables'])
    for (const m of whileModules) {
      expect(m.concepts, m.id).toContain('while')
      expect(m.concepts.length, m.id).toBeGreaterThanOrEqual(2)
      for (const c of m.concepts)
        expect(allowed.has(c), `${m.id}: ${c}`).toBe(true)
    }
  })

  it('the code really uses while, and only taught syntax', () => {
    for (const source of [
      countdownLock.code.join('\n'),
      retryLimit.code.join('\n'),
      stuckLoop.solution.join('\n'),
    ]) {
      expect(source).toMatch(/^while /m)
      expect(source).not.toMatch(/\b(break|continue|in|for|def)\b/)
    }
  })

  it('mixes interactions: predict, choose and write', () => {
    expect(whileModules.map(interactionOf)).toEqual([
      'predict',
      'choose',
      'write',
    ])
  })

  it('every wrong option explains itself', () => {
    for (const m of [countdownLock, retryLimit]) {
      for (const o of m.options) {
        if (o.id !== m.correctOptionId) expect(o.whyNot, o.code).toBeTruthy()
      }
    }
  })

  it('stay out of the Arcade', () => {
    for (const ref of arcadeModules) {
      expect(whileModules.map((m) => m.id)).not.toContain(ref.id)
    }
  })

  it('the While loops lesson points at Code Breaker', () => {
    const concept = foundations.find((c) => c.id === 'while')!
    expect(concept.game).toBe('code-breaker')
    expect(concept.later).toMatch(/Code Breaker/)
  })
})

describe('Code Breaker: Countdown Lock (predict)', () => {
  it('the correct option is exactly what the lock prints', () => {
    const { output, error } = runProgram(countdownLock.code.join('\n'))
    expect(error).toBeNull()
    expect(output.join(', ')).toBe(getCorrectOption(countdownLock).code)
  })

  it('the tempting answers are what common misreadings would print', () => {
    // Printing after subtracting gives the "starts at 6" answer.
    const late = runProgram(
      code(
        'timer = 9',
        'while timer > 0:',
        '    timer = timer - 3',
        '    print(timer)',
        'print("OPEN")',
      ),
    ).output.join(', ')
    expect(late).toBe(countdownLock.options.find((o) => o.id === 'c')!.code)
    // `>=` would also print the 0.
    const inclusive = runProgram(
      countdownLock.code.join('\n').replace('timer > 0', 'timer >= 0'),
    ).output.join(', ')
    expect(inclusive).toBe(
      countdownLock.options.find((o) => o.id === 'b')!.code,
    )
  })
})

describe('Code Breaker: Retry Limit (choose)', () => {
  const wrongTries = (condition: string) =>
    filled(retryLimit, condition).output.filter((l) => l === 'WRONG CODE')
      .length

  it('only the correct condition gives exactly 3 tries, then LOCKED OUT', () => {
    for (const option of retryLimit.options) {
      const { output, error } = filled(retryLimit, option.code)
      expect(error, option.code).toBeNull()
      expect(output.at(-1)).toBe('LOCKED OUT')
      expect(wrongTries(option.code) === 3, option.code).toBe(
        option.id === retryLimit.correctOptionId,
      )
    }
  })

  it('the wrong options give 4 tries or none, as their explanations say', () => {
    expect(wrongTries('tries <= 3')).toBe(4)
    expect(wrongTries('tries == 3')).toBe(0)
    expect(wrongTries('tries > 3')).toBe(0)
  })
})

describe('Code Breaker: Stuck Loop (write)', () => {
  it('the solution passes; the starter, malformed and unsupported code fail', () => {
    expect(checkCode(stuckLoop, stuckLoop.solution.join('\n')).correct).toBe(
      true,
    )
    for (const source of [
      stuckLoop.starter.join('\n'),
      '',
      'def (',
      'try:\n    pass',
      'import os',
      code('while heat >= 50:', '    print(heat)', '    break'),
    ]) {
      const verdict = checkCode(stuckLoop, source)
      expect(verdict.correct).toBe(false)
      expect(verdict.message.length).toBeGreaterThan(10)
    }
  })

  it('the starter never ends: stopped safely with the loop named', () => {
    const verdict = check(stuckLoop, ...stuckLoop.starter)
    expect(verdict.correct).toBe(false)
    expect(verdict.message).toMatch(/never ends: nothing inside it changes/)
    expect(verdict.error).toBe(
      'Line 1 · Timeout: `while heat >= 50` never became False. Does the loop change `heat`?',
    )
    // Output printed before the limit is kept (it repeats the reading).
    expect(verdict.output.slice(0, 3)).toEqual(['80', '80', '80'])
  })

  it('a decrement outside the loop still never ends', () => {
    const verdict = check(
      stuckLoop,
      'while heat >= 50:',
      '    print(heat)',
      'heat = heat - 10',
      'print("COOL")',
    )
    expect(verdict.message).toMatch(/never ends/)
  })

  it('accepts equivalent fixes', () => {
    for (const fix of [
      [
        'while heat >= 50:',
        '    print(heat)',
        '    heat -= 10',
        'print("COOL")',
      ],
      [
        'while heat >= 50:',
        '    print(heat)',
        '    heat = heat + -10',
        'print("COOL")',
      ],
      [
        'while heat > 49:',
        '    print(heat)',
        '    heat -= 10',
        'print("COOL")',
      ],
      [
        'temp = heat',
        'while temp >= 50:',
        '    print(temp)',
        '    temp = temp - 10',
        'print("COOL")',
      ],
    ]) {
      expect(
        checkCode(stuckLoop, fix.join('\n')).correct,
        fix.join(' / '),
      ).toBe(true)
    }
  })

  it('diagnoses common mistakes', () => {
    expect(
      check(
        stuckLoop,
        'while heat >= 50:',
        '    heat = heat - 10',
        '    print(heat)',
        'print("COOL")',
      ).message,
    ).toMatch(/80, is missing/)
    expect(
      check(
        stuckLoop,
        'while heat >= 50:',
        '    print(heat)',
        '    heat = heat - 1',
        'print("COOL")',
      ).message,
    ).toMatch(/by 10 each pass, not 1/)
    expect(
      check(
        stuckLoop,
        'while heat > 50:',
        '    print(heat)',
        '    heat = heat - 10',
        'print("COOL")',
      ).message,
    ).toMatch(/exactly 50/)
  })

  it('refuses typed answers and loops that are not while loops', () => {
    expect(
      check(
        stuckLoop,
        'print(80)',
        'print(70)',
        'print(60)',
        'print(50)',
        'print("COOL")',
      ).correct,
    ).toBe(false)
    // Passes every test but drops the while loop.
    expect(
      check(
        stuckLoop,
        'for h in range(heat, 49, -10):',
        '    print(h)',
        'print("COOL")',
      ),
    ).toMatchObject({ correct: false })
  })

  it('three hints that never contain a finished line', () => {
    expect(stuckLoop.hints).toHaveLength(3)
    const starter = stuckLoop.starter.map((l) => l.trim())
    const lines = stuckLoop.solution
      .map((l) => l.trim())
      .filter((l) => l && !starter.includes(l))
    expect(lines).toEqual(['heat = heat - 10'])
    for (const hint of stuckLoop.hints) {
      for (const line of [...lines, 'heat -= 10']) {
        expect(hint).not.toContain(line)
      }
    }
  })
})
