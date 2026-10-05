import { describe, expect, it } from 'vitest'
import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import { checkCode, type CodeChallenge } from '../challenges/code.ts'
import {
  CODE_SLOT,
  getCorrectOption,
  type CodeBreakerChallenge,
} from '../challenges/codeBreaker.ts'
import { isCorrectAnswer } from '../challenges/dataSorter.ts'
import { interactionOf, type GameModule } from '../challenges/interaction.ts'
import { runOps } from '../challenges/listOps.ts'
import { tierOf } from '../challenges/meta.ts'
import { runProgram } from '../python/interpreter.ts'
import { arcadeChallenges } from './arcade.ts'
import { foundations } from './foundations.ts'
import { gameModules } from './gameChallenges.ts'
import {
  bonusChain,
  coolingRelay,
  doubleTrace,
  inventoryShuffle,
  lifeCounter,
  powerLimiter,
  runningTotal,
  scoreBonus,
  shiftedSlot,
  twinGates,
  workshopModules,
} from './workshopChallenges.ts'

const code = (...lines: string[]) => lines.join('\n')
const check = (c: CodeChallenge, ...lines: string[]) =>
  checkCode(c, code(...lines))
const run = (...lines: string[]) => runProgram(code(...lines)).output

/** Runs a Bug Hunt program with one line replaced by a patch. */
function patched(challenge: BugHuntChallenge, fixId: string) {
  const fix = challenge.fixes.find((f) => f.id === fixId)!
  const lines = [...challenge.code]
  lines[fix.line - 1] = fix.code
  return runProgram(lines.join('\n')).output
}

/** Which game each new module belongs to. */
const homes: Record<string, keyof typeof gameModules> = {
  'life-counter': 'bug-hunt',
  'score-bonus': 'bug-hunt',
  'twin-gates': 'code-breaker',
  'cooling-relay': 'code-breaker',
  'inventory-shuffle': 'data-sorter',
  'shifted-slot': 'data-sorter',
  'running-total': 'data-sorter',
  'double-trace': 'function-forge',
  'bonus-chain': 'function-forge',
  'power-limiter': 'function-forge',
}

describe('new modules: metadata and placement', () => {
  it('adds ten modules: 2 Bug Hunt, 2 Code Breaker, 3 Data Sorter, 3 Function Forge', () => {
    expect(workshopModules).toHaveLength(10)
    const perGame = Object.values(homes).reduce<Record<string, number>>(
      (n, g) => ({ ...n, [g]: (n[g] ?? 0) + 1 }),
      {},
    )
    expect(perGame).toEqual({
      'bug-hunt': 2,
      'code-breaker': 2,
      'data-sorter': 3,
      'function-forge': 3,
    })
  })

  it('every module id is unique across CODEBOUND', () => {
    const ids = [
      ...Object.entries(gameModules).flatMap(([g, ms]) =>
        ms.map((m) => `${g}:${m.id}`),
      ),
      ...arcadeChallenges.map((c) => `arcade:${c.id}`),
    ]
    expect(new Set(ids).size).toBe(ids.length)
    // And no new id reuses an id from another game.
    const plain = Object.values(gameModules).flatMap((ms) =>
      ms.map((m) => m.id),
    )
    for (const m of workshopModules) {
      expect(plain.filter((id) => id === m.id)).toHaveLength(1)
    }
  })

  it('each is an ADVANCED module of its game, after the old advanced and before the boss', () => {
    for (const m of workshopModules) {
      const list: readonly GameModule[] = gameModules[homes[m.id]]
      const at = list.indexOf(m)
      expect(at, m.id).toBeGreaterThan(-1)
      expect(tierOf(m)).toBe('advanced')
      expect(tierOf(list[at + 1])).not.toBe('core')
      expect(list.at(-1)).not.toBe(m)
    }
  })

  it('uses only Foundations concepts, at least two each', () => {
    const taught = new Set(foundations.map((c) => c.id))
    for (const m of workshopModules) {
      expect(m.concepts.length, m.id).toBeGreaterThanOrEqual(2)
      for (const c of m.concepts)
        expect(taught.has(c), `${m.id}: ${c}`).toBe(true)
    }
  })

  it('balances interactions: 3 choose, 3 predict, 2 build, 2 write', () => {
    const count = (kind: string) =>
      workshopModules.filter((m) => interactionOf(m) === kind).length
    expect([
      count('choose'),
      count('predict'),
      count('build'),
      count('write'),
    ]).toEqual([3, 3, 2, 2])
  })

  it('every wrong option explains itself', () => {
    for (const m of workshopModules) {
      let options: { id: string; whyNot?: string }[] = []
      if ('fixes' in m) {
        options = m.fixes.filter((f) => f.id !== m.correctFixId)
      } else if ('rule' in m) {
        options = m.options.filter((o) => o.id !== m.correctOptionId)
      } else if ('task' in m && m.task.kind === 'choose') {
        const task = m.task
        options = task.options.filter((o) => o.id !== task.correctOptionId)
      }
      for (const o of options)
        expect(o.whyNot?.length, m.id).toBeGreaterThan(20)
    }
  })
})

describe('Bug Hunt: Life Counter', () => {
  it('only the correct patch prints the expected output', () => {
    expect(patched(lifeCounter, lifeCounter.correctFixId)).toEqual(['2'])
    for (const fix of lifeCounter.fixes) {
      if (fix.id === lifeCounter.correctFixId) continue
      expect(patched(lifeCounter, fix.id), fix.id).not.toEqual(['2'])
    }
  })

  it('the original program really prints 3 (the bug is real)', () => {
    expect(run(...lifeCounter.code)).toEqual(['3'])
  })
})

describe('write modules', () => {
  it.each([scoreBonus, powerLimiter].map((c) => [c.id, c] as const))(
    '%s: the solution passes; the starter, malformed and unsupported code fail',
    (_, challenge) => {
      expect(checkCode(challenge, challenge.solution.join('\n')).correct).toBe(
        true,
      )
      for (const source of [
        challenge.starter.join('\n'),
        '',
        'def (',
        'while True:\n    pass',
        'import os',
      ]) {
        const verdict = checkCode(challenge, source)
        expect(verdict.correct).toBe(false)
        expect(verdict.message.length).toBeGreaterThan(10)
      }
    },
  )

  it.each([scoreBonus, powerLimiter].map((c) => [c.id, c] as const))(
    '%s: three hints that never contain a finished line',
    (_, challenge) => {
      expect(challenge.hints).toHaveLength(3)
      const starter = challenge.starter.map((l) => l.trim())
      const lines = challenge.solution
        .map((l) => l.trim())
        .filter((l) => l && !starter.includes(l) && l !== 'else:')
      for (const hint of challenge.hints) {
        for (const line of lines) expect(hint).not.toContain(line)
      }
    },
  )
})

describe('Bug Hunt: Score Bonus (write)', () => {
  it('explains the text-versus-number crash and the boundary', () => {
    expect(check(scoreBonus, ...scoreBonus.starter).message).toMatch(
      /still text/,
    )
    expect(
      check(
        scoreBonus,
        'bonus = 10',
        'score = int(score)',
        'if score >= 40:',
        '    score = score + bonus',
        'print(score)',
      ).message,
    ).toMatch(/exactly 40/)
  })

  it('accepts equivalent fixes', () => {
    expect(
      check(
        scoreBonus,
        'points = int(score)',
        'if points > 40:',
        '    points += 10',
        'print(points)',
      ).correct,
    ).toBe(true)
    expect(
      check(
        scoreBonus,
        'bonus = 10',
        'if int(score) > 40:',
        '    print(int(score) + bonus)',
        'else:',
        '    print(int(score))',
      ).correct,
    ).toBe(true)
  })

  it('refuses typed answers and joined text', () => {
    expect(check(scoreBonus, 'print(55)').correct).toBe(false)
    // "45" + "10" joins text: 4510, not 55.
    expect(
      check(
        scoreBonus,
        'if int(score) > 40:',
        '    score = score + "10"',
        'print(score)',
      ).correct,
    ).toBe(false)
  })
})

describe('Code Breaker: Twin Gates (predict)', () => {
  it('the correct option is exactly what the gates print', () => {
    const output = runProgram(twinGates.code.join('\n')).output
    expect(output.join(', ')).toBe(getCorrectOption(twinGates).code)
  })

  it('swapping or / and would print the tempting wrong answers', () => {
    const swapped = twinGates.code.map((l) =>
      l.includes(' or ')
        ? l.replace(' or ', ' and ')
        : l.replace(' and ', ' or '),
    )
    expect(runProgram(swapped.join('\n')).output.join(', ')).toBe(
      'A LOCKED, B OPEN',
    )
  })
})

describe('Code Breaker: Cooling Relay (choose)', () => {
  const rule = (t: number) => (t > 90 ? 'ALERT' : t >= 70 ? 'WARN' : 'OK')
  const relay = (
    challenge: CodeBreakerChallenge,
    condition: string,
    t: number,
  ) =>
    runProgram(
      challenge.code
        .map((l) => l.replace(CODE_SLOT, condition))
        .join('\n')
        .replace('temp = 85', `temp = ${t}`),
    ).output[0]

  it('only the correct condition matches the rule at every temperature', () => {
    const temps = [20, 69, 70, 71, 85, 90, 91, 120]
    for (const option of coolingRelay.options) {
      const matches = temps.every(
        (t) => relay(coolingRelay, option.code, t) === rule(t),
      )
      expect(matches, option.code).toBe(
        option.id === coolingRelay.correctOptionId,
      )
    }
  })

  it('more than one option works for the state shown, so the rule decides', () => {
    const at85 = coolingRelay.options.filter(
      (o) => relay(coolingRelay, o.code, 85) === 'WARN',
    )
    expect(at85.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Data Sorter: list state', () => {
  it('Inventory Shuffle: the answer is what the three operations really leave', () => {
    const after = runOps(inventoryShuffle.input, inventoryShuffle.ops!)
    expect(after).toEqual(inventoryShuffle.result.values)
    expect(
      isCorrectAnswer(inventoryShuffle, { kind: 'build', values: after }),
    ).toBe(true)
    expect(run(...inventoryShuffle.code, 'print(crates)')).toEqual([
      '[23, 15, 16]',
    ])
    // The tempting mistake: setting index 0 before the pop shifts things.
    expect(
      isCorrectAnswer(inventoryShuffle, {
        kind: 'build',
        values: [23, 8, 15, 16],
      }),
    ).toBe(false)
  })

  it('Shifted Slot: the tapped cell is the value really printed after the pop', () => {
    const { input, task } = shiftedSlot
    if (task.kind !== 'pick') throw new Error('pick task expected')
    expect(run(...shiftedSlot.code)).toEqual([String(input[task.answerIndex])])
    expect(runOps(input, shiftedSlot.ops!)).toEqual(shiftedSlot.result.values)
    // Index 1 of the old list is the plausible wrong tap.
    expect(isCorrectAnswer(shiftedSlot, { kind: 'pick', index: 1 })).toBe(false)
  })

  it('Running Total: the answer is every value the loop prints', () => {
    const { task } = runningTotal
    if (task.kind !== 'build') throw new Error('build task expected')
    expect(run(...runningTotal.code)).toEqual(task.answer.map(String))
    for (const v of task.answer) expect(task.pool).toContain(v)
    // Printing p instead of total would give the list itself.
    expect(
      isCorrectAnswer(runningTotal, { kind: 'build', values: [3, 5, 2] }),
    ).toBe(false)
  })
})

describe('Function Forge: tracing', () => {
  const forgeAnswer = (m: typeof doubleTrace) => {
    if (m.task.kind !== 'choose') throw new Error('choose task expected')
    return m.task.options.find(
      (o) => o.id === (m.task as { correctOptionId: string }).correctOptionId,
    )!.code
  }

  it('Double Trace: the correct option is the value really stored', () => {
    expect(run(...doubleTrace.code, 'print(value)')).toEqual([
      forgeAnswer(doubleTrace),
    ])
  })

  it('Bonus Chain: the correct option is the final score', () => {
    expect(run(...bonusChain.code, 'print(score)')).toEqual([
      forgeAnswer(bonusChain),
    ])
    // With >= the boundary would give the tempting 150.
    expect(
      run(
        ...bonusChain.code.map((l) => l.replace('> 100', '>= 100')),
        'print(score)',
      ),
    ).toEqual(['150'])
  })
})

describe('Function Forge: Power Limiter (write from scratch)', () => {
  it('accepts equivalent functions', () => {
    for (const body of [
      ['    if value <= top:', '        return value', '    return top'],
      [
        '    if value > top:',
        '        return top',
        '    else:',
        '        return value',
      ],
      [
        '    result = value',
        '    if result > top:',
        '        result = top',
        '    return result',
      ],
    ]) {
      expect(
        check(powerLimiter, 'def limit(value, top):', ...body).correct,
      ).toBe(true)
    }
  })

  it('explains each common mistake', () => {
    expect(
      check(powerLimiter, '# write the limit function here').message,
    ).toMatch(/no `limit` to call yet/)
    expect(
      check(
        powerLimiter,
        'def limit(value, top):',
        '    if value > top:',
        '        print(top)',
        '    else:',
        '        print(value)',
      ).message,
    ).toMatch(/gets `None`/)
    expect(
      check(powerLimiter, 'def limit(value, top):', '    return top').message,
    ).toMatch(/gave back the top/)
    expect(
      check(powerLimiter, 'def limit(value, top):', '    return value').message,
    ).toMatch(/let 12 through/)
  })

  it('cannot be passed with a typed answer', () => {
    expect(
      check(powerLimiter, 'def limit(value, top):', '    return 10').correct,
    ).toBe(false)
  })
})
