import { describe, expect, it } from 'vitest'
import { checkCode, type CodeChallenge } from '../challenges/code.ts'
import {
  accessRule,
  adder,
  brokenBadge,
  doubler,
  fixReading,
  queueIntake,
  ticketTotal,
  useIt,
  vaultThreshold,
} from './codeChallenges.ts'

const code = (...lines: string[]) => lines.join('\n')
const check = (c: CodeChallenge, ...lines: string[]) =>
  checkCode(c, code(...lines))

const all = [
  ticketTotal,
  brokenBadge,
  vaultThreshold,
  accessRule,
  fixReading,
  queueIntake,
  doubler,
  adder,
  useIt,
]

describe('every write module', () => {
  it.each(all.map((c) => [c.id, c] as const))(
    '%s: the solution passes and the starter code does not',
    (_, challenge) => {
      expect(checkCode(challenge, challenge.solution.join('\n'))).toMatchObject(
        { correct: true },
      )
      expect(checkCode(challenge, challenge.starter.join('\n')).correct).toBe(
        false,
      )
    },
  )

  it.each(all.map((c) => [c.id, c] as const))(
    '%s: hints build up and never contain the solution',
    (_, challenge) => {
      expect(challenge.hints).toHaveLength(3)
      const solved = challenge.solution.map((l) => l.trim()).filter(Boolean)
      const starter = challenge.starter.map((l) => l.trim())
      for (const hint of challenge.hints) {
        for (const line of solved) {
          if (starter.includes(line)) continue
          expect(hint).not.toContain(line)
        }
      }
    },
  )

  it.each(all.map((c) => [c.id, c] as const))(
    '%s: rejects empty and malformed code safely',
    (_, challenge) => {
      for (const source of ['', 'print(', 'if True\n  x', 'import os', '}{']) {
        const verdict = checkCode(challenge, source)
        expect(verdict.correct).toBe(false)
        expect(verdict.message.length).toBeGreaterThan(0)
      }
    },
  )
})

describe('Bug Hunt: Ticket Counter', () => {
  it('accepts either order of the multiplication', () => {
    expect(
      check(
        ticketTotal,
        'price = 8',
        'count = 3',
        'total = count * price',
        'print(total)',
      ).correct,
    ).toBe(true)
  })

  it('names the unchanged addition', () => {
    expect(
      check(
        ticketTotal,
        'price = 8',
        'count = 3',
        'total = price + count',
        'print(total)  ',
      ).message,
    ).toMatch(/still adds/)
  })

  it('refuses a typed answer', () => {
    expect(check(ticketTotal, 'print(24)')).toMatchObject({
      correct: false,
      message: expect.stringMatching(/instead of typing 24/),
    })
    expect(check(ticketTotal, 'print(8 * 3)').message).toMatch(/price/)
  })
})

describe('Bug Hunt: Broken Badge', () => {
  const start = ['name = "Sam"', 'level = 4']

  it('accepts str() or print with commas', () => {
    expect(
      check(
        brokenBadge,
        ...start,
        'print("Player " + name + " is level " + str(level))',
      ).correct,
    ).toBe(true)
    expect(
      check(brokenBadge, ...start, 'print("Player", name, "is level", level)')
        .correct,
    ).toBe(true)
  })

  it('explains the text + number error', () => {
    expect(
      check(
        brokenBadge,
        ...start,
        'print("Player " + name + " level " + level)',
      ).message,
    ).toMatch(/can't join text and a number/)
  })

  it('shows a spacing mistake as printed vs expected', () => {
    const verdict = check(
      brokenBadge,
      ...start,
      'print("Player" + name + "is level" + str(level))',
    )
    expect(verdict.message).toMatch(/printed `PlayerSamis level4`/)
  })

  it('refuses a typed level', () => {
    expect(
      check(brokenBadge, ...start, 'print("Player " + name + " is level 4")')
        .message,
    ).toMatch(/Keep using the `level` variable/)
  })
})

describe('Code Breaker: Vault Threshold', () => {
  it('passes with >= and explains the boundary with >', () => {
    expect(
      check(
        vaultThreshold,
        'if power >= 50:',
        '    print("OPEN")',
        'else:',
        '    print("LOCKED")',
      ).correct,
    ).toBe(true)
    expect(
      check(
        vaultThreshold,
        'if power > 50:',
        '    print("OPEN")',
        'else:',
        '    print("LOCKED")  ',
      ).message,
    ).toMatch(/leaves 50 out/)
  })

  it('tests every case, so a lock that always opens fails', () => {
    const verdict = check(vaultThreshold, 'print("OPEN")')
    expect(verdict.correct).toBe(false)
    expect(verdict.message).toMatch(/When power = 49/)
  })

  it('asks for >= even when > 49 behaves the same', () => {
    expect(
      check(
        vaultThreshold,
        'if power > 49:',
        '    print("OPEN")',
        'else:',
        '    print("LOCKED")',
      ).message,
    ).toMatch(/Write it with `>=`/)
  })

  it('explains = instead of ==', () => {
    expect(
      check(vaultThreshold, 'if power = 50:', '    print("OPEN")').error,
    ).toMatch(/Use == to compare/)
  })
})

describe('Code Breaker: Access Rule', () => {
  const lock = (condition: string) =>
    check(
      accessRule,
      `if ${condition}:`,
      '    print("ACCESS GRANTED")',
      'else:',
      '    print("ACCESS DENIED")',
    )

  it('accepts equivalent conditions', () => {
    expect(lock('pin == 1234 and level >= 3').correct).toBe(true)
    expect(lock('level >= 3 and pin == 1234').correct).toBe(true)
    expect(lock('pin == 1234 and level > 2').correct).toBe(true)
  })

  it('diagnoses or, a missing part, and the level boundary', () => {
    expect(lock('pin == 1234 or level >= 3').message).toMatch(/With `or`/)
    expect(lock('pin == 1234').message).toMatch(/never checks `level`/)
    expect(lock('level >= 3').message).toMatch(/never checks `pin`/)
    expect(lock('pin == 1234 and level > 3').message).toMatch(/exactly 3/)
  })

  it('asks to fill the blank first', () => {
    expect(checkCode(accessRule, accessRule.starter.join('\n')).error).toMatch(
      /Replace ____/,
    )
  })
})

describe('Data Sorter: Fix the Reading', () => {
  it('passes with an index assignment and shows the list', () => {
    const verdict = check(
      fixReading,
      'readings = [41, 12, 38]',
      'readings[1] = 30',
    )
    expect(verdict).toMatchObject({ correct: true, list: [41, 30, 38] })
  })

  it('catches the off-by-one index and shows what changed', () => {
    const verdict = check(
      fixReading,
      'readings = [41, 12, 38]',
      'readings[2] = 30',
    )
    expect(verdict.message).toMatch(/index 2, which is the third item/)
    expect(verdict.list).toEqual([41, 12, 30])
  })

  it('catches an index past the end', () => {
    expect(
      check(fixReading, 'readings = [41, 12, 38]', 'readings[3] = 30').message,
    ).toMatch(/past the end/)
  })

  it('refuses a rebuilt list', () => {
    expect(check(fixReading, 'readings = [41, 30, 38]').message).toMatch(
      /you rebuilt it/,
    )
  })
})

describe('Data Sorter: Queue Intake', () => {
  it('passes with append', () => {
    expect(
      check(queueIntake, 'queue = [12, 18, 7]', 'queue.append(25)'),
    ).toMatchObject({ correct: true, list: [12, 18, 7, 25] })
  })

  it('explains assigning past the end and replacing an item', () => {
    expect(
      check(queueIntake, 'queue = [12, 18, 7]', 'queue[3] = 25').message,
    ).toMatch(/doesn't exist yet/)
    expect(
      check(queueIntake, 'queue = [12, 18, 7]', 'queue[2] = 25').message,
    ).toMatch(/replaced the last job/)
  })

  it('refuses a rebuilt list', () => {
    expect(check(queueIntake, 'queue = [12, 18, 7, 25]').message).toMatch(
      /rebuilt it by hand/,
    )
  })
})

describe('Function Forge: Doubler', () => {
  it('accepts any correct body', () => {
    expect(check(doubler, 'def double(x):', '    return 2 * x').correct).toBe(
      true,
    )
    expect(check(doubler, 'def double(x):', '    return x + x').correct).toBe(
      true,
    )
  })

  it('explains print instead of return, and a missing return', () => {
    expect(
      check(doubler, 'def double(x):', '    print(x * 2)').message,
    ).toMatch(/printed `8` but returned `None`/)
    expect(check(doubler, 'def double(x):', '    y = x * 2').message).toMatch(
      /missing a `return`/,
    )
  })

  it('catches a hard-coded result', () => {
    expect(check(doubler, 'def double(x):', '    return 8').message).toMatch(
      /always returns 8/,
    )
  })

  it('reports a misnamed function', () => {
    expect(check(doubler, 'def twice(x):', '    return x * 2').message).toMatch(
      /no function named double/,
    )
  })
})

describe('Function Forge: Adder', () => {
  it('passes with any parameter names', () => {
    expect(check(adder, 'def add(x, y):', '    return x + y').correct).toBe(
      true,
    )
  })

  it('explains a wrong parameter count and a wrong operation', () => {
    expect(check(adder, 'def add(a):', '    return a').message).toMatch(
      /wrong number of parameters/,
    )
    expect(check(adder, 'def add(a, b):', '    return a - b').message).toMatch(
      /`add\(2, 3\)` returned `-1`. It should return `5`/,
    )
  })

  it('needs the body indented', () => {
    expect(check(adder, 'def add(a, b):', 'return a + b').error).toMatch(
      /indented/,
    )
  })
})

describe('Function Forge: Use It', () => {
  const def = ['def area(w, h):', '    return w * h']

  it('accepts printing the call directly or via a variable', () => {
    expect(check(useIt, ...def, 'print(area(4, 6))').correct).toBe(true)
    expect(
      check(useIt, ...def, 'size = area(6, 4)', 'print(size)').correct,
    ).toBe(true)
  })

  it('explains a call that is never printed', () => {
    expect(check(useIt, ...def, 'area(4, 6)').message).toMatch(
      /Nothing was printed/,
    )
  })

  it('refuses a typed answer', () => {
    expect(check(useIt, ...def, 'print(24)').message).toMatch(/Let `area` do/)
  })
})
