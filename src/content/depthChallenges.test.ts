import { describe, expect, it } from 'vitest'
import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import { checkCode, type CodeChallenge } from '../challenges/code.ts'
import { getCorrectOption } from '../challenges/codeBreaker.ts'
import { repr, runProgram } from '../python/interpreter.ts'
import { bugHuntChallenges } from './bugHuntChallenges.ts'
import {
  averageScore,
  countAlerts,
  feeCalculator,
  memberDiscount,
  overrideSwitch,
  scoreTotal,
  sensorRepair,
  shiftScheduler,
  shippingRule,
  shopCheckout,
  thresholdFilter,
  vaultCore,
} from './depthChallenges.ts'

const code = (...lines: string[]) => lines.join('\n')
const check = (c: CodeChallenge, ...lines: string[]) =>
  checkCode(c, code(...lines))

const writes = [
  averageScore,
  shopCheckout,
  shiftScheduler,
  vaultCore,
  countAlerts,
  sensorRepair,
  scoreTotal,
  shippingRule,
]

/** Runs a Bug Hunt program with one line replaced by a patch. */
function patched(challenge: BugHuntChallenge, fixId: string) {
  const fix = challenge.fixes.find((f) => f.id === fixId)!
  const lines = [...challenge.code]
  lines[fix.line - 1] = fix.code
  return runProgram(lines.join('\n')).output
}

describe('advanced and boss write modules', () => {
  it.each(writes.map((c) => [c.id, c] as const))(
    '%s: the solution passes; the starter, malformed and unsupported code fail',
    (_, challenge) => {
      expect(checkCode(challenge, challenge.solution.join('\n')).correct).toBe(
        true,
      )
      for (const source of [
        challenge.starter.join('\n'),
        '',
        'def (',
        'try:\n    pass',
        'import os',
      ]) {
        const verdict = checkCode(challenge, source)
        expect(verdict.correct).toBe(false)
        expect(verdict.message.length).toBeGreaterThan(10)
      }
    },
  )

  it.each(writes.map((c) => [c.id, c] as const))(
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

describe('Bug Hunt: Member Discount (advanced, choose)', () => {
  it('only the correct patch prints the expected output', () => {
    expect(patched(memberDiscount, memberDiscount.correctFixId)).toEqual([
      memberDiscount.expectedOutput,
    ])
    for (const fix of memberDiscount.fixes) {
      if (fix.id === memberDiscount.correctFixId) continue
      expect(patched(memberDiscount, fix.id)).not.toEqual([
        memberDiscount.expectedOutput,
      ])
    }
  })

  it('every Bug Hunt patch, old and new, is confirmed by the simulator', () => {
    for (const challenge of [...bugHuntChallenges, memberDiscount]) {
      const output = patched(challenge, challenge.correctFixId)
      expect(output.join('\n')).toBe(challenge.expectedOutput)
    }
  })
})

describe('Bug Hunt: Average Score (advanced)', () => {
  const start = ['a = 7', 'b = 9']

  it('names each of the two tangled bugs', () => {
    expect(
      check(
        averageScore,
        ...start,
        'average = (a + b) / 2',
        'print("Average: " + average)',
      ).message,
    ).toMatch(/can't join text and a number/)
    expect(
      check(
        averageScore,
        ...start,
        'average = a + b / 2',
        'print("Average: " + str(average))',
      ).message,
    ).toMatch(/divides before it adds/)
  })

  it('accepts print with commas and refuses a typed average', () => {
    expect(
      check(
        averageScore,
        ...start,
        'average = (a + b) / 2',
        'print("Average:", average)',
      ).correct,
    ).toBe(true)
    expect(
      check(averageScore, 'average = 8.0', 'print("Average: " + str(average))')
        .message,
    ).toMatch(/instead of typing 8.0/)
    expect(check(averageScore, 'print("Average: 8.0")').message).toMatch(
      /add them first, then divide/,
    )
  })
})

describe('Bug Hunt: Shop Checkout (boss)', () => {
  const lines = (calc: string, cond: string, msg: string) =>
    check(
      shopCheckout,
      `total = ${calc}`,
      `if total ${cond} 30:`,
      '    total = total - 5',
      msg,
    )
  const good = 'print("You pay " + str(total))'

  it('needs all three repairs', () => {
    expect(lines('price * quantity', '>=', good).correct).toBe(true)
    expect(
      lines('quantity * price', '>=', 'print("You pay", total)').correct,
    ).toBe(true)
  })

  it('explains whichever problem is still left', () => {
    expect(
      lines('price * quantity', '>=', 'print("You pay " + total)').message,
    ).toMatch(/crashes on the last line/)
    expect(lines('price + quantity', '>=', good).message).toMatch(
      /multiplication/,
    )
    expect(lines('price * quantity', '>', good).message).toMatch(/exactly 30/)
  })

  it('cannot be passed by hard-coding one order', () => {
    expect(check(shopCheckout, 'print("You pay 31")').correct).toBe(false)
  })
})

describe('Code Breaker: Override Switch (advanced, predict)', () => {
  it('the correct option is what the panel really prints', () => {
    expect(runProgram(overrideSwitch.code.join('\n')).output).toEqual([
      getCorrectOption(overrideSwitch).code,
    ])
  })
})

describe('Code Breaker: Shift Scheduler (advanced)', () => {
  const shift = (...l: string[]) => check(shiftScheduler, ...l)

  it('accepts equivalent range checks', () => {
    expect(
      shift(
        'if hour < 8:',
        '    print("CLOSED")',
        'elif hour <= 17:',
        '    print("DAY")',
        'else:',
        '    print("NIGHT")',
      ).correct,
    ).toBe(true)
    expect(
      shift(
        'if 8 <= hour <= 17:',
        '    print("DAY")',
        'elif hour >= 18:',
        '    print("NIGHT")',
        'else:',
        '    print("CLOSED")',
      ).correct,
    ).toBe(true)
  })

  it('explains a DAY branch with no upper limit, and a missing third branch', () => {
    expect(
      shift(
        'if hour >= 8:',
        '    print("DAY")',
        'elif hour >= 18:',
        '    print("NIGHT")',
        'else:',
        '    print("CLOSED")',
      ).message,
    ).toMatch(/upper limit/)
    expect(
      shift(
        'if hour >= 8 and hour <= 17:',
        '    print("DAY")',
        'else:',
        '    print("CLOSED")',
      ).message,
    ).toMatch(/third branch/)
  })

  it('explains an off-by-one at 17', () => {
    expect(
      shift(
        'if hour >= 8 and hour < 17:',
        '    print("DAY")',
        'elif hour >= 17:',
        '    print("NIGHT")',
        'else:',
        '    print("CLOSED")',
      ).message,
    ).toMatch(/includes 17/)
  })
})

describe('Code Breaker: Vault Core (boss)', () => {
  const vault = (...l: string[]) => check(vaultCore, ...l)
  const open = 'elif code == 7291 and (key or override):'

  it('passes with the alarm first and grouped or', () => {
    expect(vault(...vaultCore.solution).correct).toBe(true)
    expect(
      vault(
        'if attempts > 2:',
        '    print("ALARM")',
        'elif code == 7291 and (override or key):',
        '    print("OPEN")',
        'else:',
        '    print("DENIED")',
      ).correct,
    ).toBe(true)
  })

  it('explains a missing override, missing brackets, a late alarm and the alarm boundary', () => {
    expect(
      vault(
        'if attempts >= 3:',
        '    print("ALARM")',
        'elif code == 7291 and key:',
        '    print("OPEN")',
        'else:',
        '    print("DENIED")',
      ).message,
    ).toMatch(/override should be enough/)
    expect(
      vault(
        'if attempts >= 3:',
        '    print("ALARM")',
        'elif code == 7291 and key or override:',
        '    print("OPEN")',
        'else:',
        '    print("DENIED")',
      ).message,
    ).toMatch(/group the key and override/)
    expect(
      vault(
        'if code == 7291 and (key or override):',
        '    print("OPEN")',
        'elif attempts >= 3:',
        '    print("ALARM")',
        'else:',
        '    print("DENIED")',
      ).message,
    ).toMatch(/Check `attempts` before anything else/)
    expect(
      vault(
        'if attempts >= 2:',
        '    print("ALARM")',
        open,
        '    print("OPEN")',
        'else:',
        '    print("DENIED")',
      ).message,
    ).toMatch(/2 attempts is still allowed/)
  })
})

describe('Data Sorter: Threshold Filter (advanced, build)', () => {
  it('the answer is exactly what the program prints', () => {
    const task = thresholdFilter.task
    if (task.kind !== 'build') throw new Error('expected build')
    expect(runProgram(thresholdFilter.code.join('\n')).output).toEqual(
      task.answer.map(String),
    )
    expect(thresholdFilter.result.values).toEqual(task.answer)
  })
})

describe('Data Sorter: Count Alerts (advanced)', () => {
  const start = ['readings = [12, 30, 7, 45, 18]', 'alerts = 0']

  it('accepts either way of adding one', () => {
    expect(
      check(
        countAlerts,
        ...start,
        'for r in readings:',
        '    if r > 15:',
        '        alerts = alerts + 1',
        'print(alerts)',
      ).correct,
    ).toBe(true)
  })

  it('explains printing inside the loop, counting all, a reversed condition and no counting', () => {
    expect(
      check(
        countAlerts,
        ...start,
        'for r in readings:',
        '    if r > 15:',
        '        alerts += 1',
        '        print(alerts)',
      ).message,
    ).toMatch(/every pass/)
    expect(
      check(
        countAlerts,
        ...start,
        'for r in readings:',
        '    alerts += 1',
        'print(alerts)',
      ).message,
    ).toMatch(/counted every reading/)
    expect(
      check(
        countAlerts,
        ...start,
        'for r in readings:',
        '    if r <= 15:',
        '        alerts += 1',
        'print(alerts)',
      ).message,
    ).toMatch(/reversed/)
    expect(
      check(
        countAlerts,
        ...start,
        'for r in readings:',
        '    if r > 15:',
        '        pass',
        'print(alerts)',
      ).message,
    ).toMatch(/never changes/)
  })

  it('refuses a typed count', () => {
    expect(
      check(countAlerts, ...start, 'alerts = 3', 'print(alerts)').message,
    ).toMatch(/`for` loop/)
  })
})

describe('Data Sorter: Sensor Repair (boss)', () => {
  const start = ['readings = [42, 180, 77, 250, 99, 100]', 'clean = []']
  const loop = (cond: string, ...after: string[]) =>
    check(
      sensorRepair,
      ...start,
      'for r in readings:',
      `    if ${cond}:`,
      '        clean.append(r)',
      ...after,
    )

  it('passes and shows the filtered list', () => {
    expect(loop('r <= 100', 'print(len(readings) - len(clean))')).toMatchObject(
      {
        correct: true,
        list: [42, 77, 99, 100],
      },
    )
    expect(
      loop(
        'not r > 100',
        'removed = len(readings) - len(clean)',
        'print(removed)',
      ).correct,
    ).toBe(true)
  })

  it('explains the boundary, a reversed filter, the wrong count and a missing print', () => {
    expect(
      loop('r < 100', 'print(len(readings) - len(clean))').message,
    ).toMatch(/100 is missing/)
    expect(
      loop('r > 100', 'print(len(readings) - len(clean))').message,
    ).toMatch(/reversed/)
    expect(loop('r <= 100', 'print(len(clean))').message).toMatch(
      /how many readings were kept/,
    )
    expect(loop('r <= 100').message).toMatch(/Now print how many/)
  })

  it('refuses a hand-built list and a typed count', () => {
    expect(
      check(sensorRepair, 'clean = [42, 77, 99, 100]', 'print(2)').correct,
    ).toBe(false)
    expect(loop('r <= 100', 'print(2)').message).toMatch(/`len\(\)`/)
  })
})

describe('Function Forge: Fee Calculator (advanced, predict)', () => {
  it('the correct option is what fee(12) really returns', () => {
    const run = runProgram(feeCalculator.code.slice(0, 4).join('\n'))
    const value = run.call('fee', [{ t: 'int', v: 12 }]).value!
    const task = feeCalculator.task
    if (task.kind !== 'choose') throw new Error('expected choose')
    const right = task.options.find((o) => o.id === task.correctOptionId)!
    expect(repr(value)).toBe(right.code)
    expect(feeCalculator.call?.output).toBe(right.code)
  })
})

describe('Function Forge: Score Total (advanced)', () => {
  it('explains no adding, replacing instead of adding, and returning too early', () => {
    const fn = (...body: string[]) =>
      check(scoreTotal, 'def total(scores):', '    result = 0', ...body)
    expect(
      fn('    for s in scores:', '        pass', '    return result').message,
    ).toMatch(/never adds/)
    expect(
      fn('    for s in scores:', '        result = s', '    return result')
        .message,
    ).toMatch(/last score only/)
    expect(
      fn('    for s in scores:', '        result += s', '        return result')
        .message,
    ).toMatch(/first pass/)
  })
})

describe('Function Forge: Shipping Rule (boss)', () => {
  const fn = (...body: string[]) =>
    check(shippingRule, 'def shipping(weight, express):', ...body)

  it('accepts equivalent rule orders', () => {
    expect(
      fn(
        '    cost = weight * 2',
        '    if express:',
        '        cost = cost * 2',
        '    if weight > 20:',
        '        cost = 50',
        '    return cost',
      ).correct,
    ).toBe(true)
  })

  it('explains a missing express rule, a missing flat rule, the boundary and flat express', () => {
    expect(
      fn('    if weight > 20:', '        return 50', '    return weight * 2')
        .message,
    ).toMatch(/double the price/)
    expect(
      fn(
        '    if express:',
        '        return weight * 4',
        '    return weight * 2',
      ).message,
    ).toMatch(/flat 50/)
    expect(
      fn(
        '    if weight >= 20:',
        '        return 50',
        '    if express:',
        '        return weight * 4',
        '    return weight * 2',
      ).message,
    ).toMatch(/20 kg is not over 20/)
    expect(
      fn(
        '    cost = weight * 2',
        '    if weight > 20:',
        '        cost = 50',
        '    if express:',
        '        cost = cost * 2',
        '    return cost',
      ).message,
    ).toMatch(/express orders too/)
  })

  it('explains printing instead of returning', () => {
    expect(fn('    print(weight * 2)').message).toMatch(
      /printed .* but returned `None`/,
    )
  })
})
