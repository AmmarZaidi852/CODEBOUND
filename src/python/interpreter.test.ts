import { describe, expect, it } from 'vitest'
import { int, literal, repr, runProgram, type Value } from './interpreter.ts'

/** Runs code and returns printed lines, or "Kind: message" on error. */
function out(code: string, given: Record<string, Value> = {}) {
  const result = runProgram(code, given)
  return result.error
    ? [...result.output, `${result.error.kind}: ${result.error.message}`]
    : result.output
}

const lines = (...l: string[]) => l.join('\n')

describe('Python subset simulator', () => {
  it('prints values the way Python does', () => {
    expect(
      out(
        lines(
          'print(15)',
          'print(10 / 2)',
          'print(7 / 2)',
          'print(7 // 2)',
          'print(-7 // 2)',
          'print(7 % 3)',
          'print(-7 % 3)',
          'print(2 ** 3)',
          'print("Sam", 4)',
          'print(True, None)',
          'print([1, "a", 2.5, True])',
          'print()',
        ),
      ),
    ).toEqual([
      '15',
      '5.0',
      '3.5',
      '3',
      '-4',
      '1',
      '2',
      '8',
      'Sam 4',
      'True None',
      "[1, 'a', 2.5, True]",
      '',
    ])
  })

  it('follows operator precedence and boolean logic', () => {
    expect(
      out(
        lines(
          'print(2 + 3 * 4)',
          'print((2 + 3) * 4)',
          'print(1 < 2 < 3)',
          'print(5 >= 5 and not 3 == 4)',
          'print(0 or "x")',
          'print(10 != 10 or 2 <= 1)',
        ),
      ),
    ).toEqual(['14', '20', 'True', 'True', 'x', 'False'])
  })

  it('joins text with + and str()', () => {
    expect(out('level = 4\nprint("Level " + str(level))')).toEqual(['Level 4'])
    expect(out('print("ab" * 3)')).toEqual(['ababab'])
  })

  it('runs if / elif / else', () => {
    const code = lines(
      'if temp > 90:',
      '    print("ALERT")',
      'elif temp > 70:',
      '    print("WARNING")',
      'else:',
      '    print("OK")',
    )
    expect(out(code, { temp: int(95) })).toEqual(['ALERT'])
    expect(out(code, { temp: int(80) })).toEqual(['WARNING'])
    expect(out(code, { temp: int(70) })).toEqual(['OK'])
  })

  it('loops over ranges, lists and text', () => {
    expect(out('for i in range(3):\n    print(i)')).toEqual(['0', '1', '2'])
    expect(out('for i in range(1, 7, 2):\n    print(i)')).toEqual([
      '1',
      '3',
      '5',
    ])
    expect(
      out('total = 0\nfor n in [4, 6]:\n    total += n\nprint(total)'),
    ).toEqual(['10'])
    expect(out('for c in "hi":\n    print(c)')).toEqual(['h', 'i'])
  })

  it('reads, changes and grows lists', () => {
    expect(
      out(
        lines(
          'scores = [12, 18, 7]',
          'print(scores[0], scores[-1], len(scores))',
          'scores[2] = 9',
          'scores.append(25)',
          'last = scores.pop()',
          'first = scores.pop(0)',
          'print(scores, last, first)',
        ),
      ),
    ).toEqual(['12 7 3', '[18, 9] 25 12'])
  })

  it('defines and calls functions with local variables', () => {
    const result = runProgram(
      lines(
        'def area(w, h):',
        '    size = w * h',
        '    return size',
        'print(area(4, 6))',
      ),
    )
    expect(result.output).toEqual(['24'])
    expect(result.globals.has('size')).toBe(false)
    expect(repr(result.call('area', [int(2), int(5)]).value!)).toBe('10')
  })

  it('returns None from a function without return', () => {
    const result = runProgram('def double(x):\n    print(x * 2)')
    const call = result.call('double', [int(4)])
    expect(call.value).toEqual({ t: 'none' })
    expect(call.output).toEqual(['8'])
  })

  it('reports Python errors with the same names and messages', () => {
    expect(out('print(Score)')).toEqual([
      "NameError: name 'Score' is not defined",
    ])
    expect(out('print("Level " + 4)')).toEqual([
      'TypeError: can only concatenate str (not "int") to str',
    ])
    expect(out('print([1, 2][2])')).toEqual([
      'IndexError: list index out of range',
    ])
    expect(out('x = [1]\nx[3] = 2')).toEqual([
      'IndexError: list assignment index out of range',
    ])
    expect(out('print(1 / 0)')).toEqual(['ZeroDivisionError: division by zero'])
    expect(out('def f(a, b):\n    return a\nf(1)')).toEqual([
      "TypeError: f() missing 1 required argument: 'b'",
    ])
    expect(out('n = 3\nn.append(1)')).toEqual([
      "AttributeError: 'int' object has no attribute 'append'",
    ])
    expect(out('print("a" < 1)')).toEqual([
      "TypeError: '<' not supported between instances of 'str' and 'int'",
    ])
  })

  it('keeps output printed before an error', () => {
    expect(out('print("start")\nprint(missing)')).toEqual([
      'start',
      "NameError: name 'missing' is not defined",
    ])
  })

  it('explains common syntax mistakes', () => {
    expect(out('if x = 5:\n    print(x)', { x: int(5) })).toEqual([
      'SyntaxError: Use == to compare. A single = stores a value.',
    ])
    expect(out('if x > 5\n    print(x)')).toEqual([
      'SyntaxError: This line needs a : at the end.',
    ])
    expect(out('if True:\nprint(1)')).toEqual([
      'SyntaxError: The lines inside this block need to be indented.',
    ])
    expect(out('print("hi)')).toEqual([
      'SyntaxError: This text is missing its closing quote.',
    ])
    expect(out('print((1)')).toEqual([
      'SyntaxError: A bracket is never closed.',
    ])
    expect(out('if ____:\n    print(1)')).toEqual([
      'SyntaxError: Replace ____ with your own code first.',
    ])
    expect(out('x = 1\n    y = 2')).toEqual([
      'SyntaxError: This line is indented, but nothing above opens a block.',
    ])
  })

  it('refuses code outside the subset instead of running it', () => {
    for (const code of [
      'import os',
      'try:\n    pass',
      'class A:\n    pass',
      'f = lambda x: x',
      'print(f"{x}")',
    ]) {
      const [message] = out(code)
      expect(message).toMatch(/^(Unsupported|SyntaxError):/)
    }
  })

  it('cannot reach the page or the browser', () => {
    for (const name of ['window', 'document', 'eval', 'open', 'exec']) {
      expect(out(`${name}`)).toEqual([
        `NameError: name '${name}' is not defined`,
      ])
    }
  })

  it('stops runaway programs', () => {
    expect(out('for i in range(5000):\n    print(i)').at(-1)).toMatch(
      /^Timeout/,
    )
    expect(out('def f(n):\n    return f(n)\nf(1)').at(-1)).toMatch(
      /^RecursionError/,
    )
    const nested = lines(
      'for a in range(900):',
      '    for b in range(900):',
      '        x = a',
    )
    expect(out(nested).at(-1)).toMatch(/^Timeout/)
  })

  it('reads literal test values', () => {
    expect(repr(literal('[1, "a"]'))).toBe("[1, 'a']")
    expect(repr(literal('-3'))).toBe('-3')
    expect(repr(literal('"Alex"'))).toBe("'Alex'")
  })

  it('ignores comments, including # inside text', () => {
    expect(out('# setup\nx = "#1"  # label\nprint(x)')).toEqual(['#1'])
  })
})

describe('while loops', () => {
  it('runs 0, 1 and N times, checking the condition before every pass', () => {
    const count = (start: number) =>
      out(
        lines(
          `n = ${start}`,
          'while n > 0:',
          '    print(n)',
          '    n = n - 1',
          'print("done")',
        ),
      )
    expect(count(0)).toEqual(['done'])
    expect(count(1)).toEqual(['1', 'done'])
    expect(count(4)).toEqual(['4', '3', '2', '1', 'done'])
  })

  it('stops as soon as the body changes the condition', () => {
    const code = lines(
      'locked = True',
      'tries = 0',
      'while locked:',
      '    tries = tries + 1',
      '    if tries == 3:',
      '        locked = False',
      'print(tries, locked)',
    )
    expect(out(code)).toEqual(['3 False'])
  })

  it('updates with += and -=', () => {
    const code = lines(
      'total = 0',
      'n = 5',
      'while n > 0:',
      '    total += n',
      '    n -= 2',
      'print(total, n)',
    )
    expect(out(code)).toEqual(['9 -1'])
  })

  it('works inside if, inside a function, and with a for loop inside', () => {
    const insideIf = lines(
      'power = 3',
      'if power > 0:',
      '    while power > 0:',
      '        power -= 1',
      'else:',
      '    print("never")',
      'print(power)',
    )
    expect(out(insideIf)).toEqual(['0'])

    const inFunction = lines(
      'def countdown(n):',
      '    steps = 0',
      '    while n > 0:',
      '        n -= 1',
      '        steps += 1',
      '    return steps',
      'print(countdown(4), countdown(0))',
    )
    expect(out(inFunction)).toEqual(['4 0'])

    const forInside = lines(
      'rounds = 2',
      'while rounds > 0:',
      '    for x in [1, 2]:',
      '        print(rounds * x)',
      '    rounds -= 1',
    )
    expect(out(forInside)).toEqual(['2', '4', '1', '2'])
  })

  it('reads lists in its condition', () => {
    const code = lines(
      'queue = [4, 8, 15]',
      'while len(queue) > 1:',
      '    queue.pop(0)',
      'print(queue)',
    )
    expect(out(code)).toEqual(['[15]'])
  })

  it('stops an endless loop safely and names its condition', () => {
    const code = lines(
      'energy = 5',
      'while energy > 0:',
      '    print("charging")',
    )
    const result = out(code)
    expect(result.at(-1)).toBe(
      'Timeout: `while energy > 0` never became False. Does the loop change `energy`?',
    )
    expect(runProgram(code).error?.line).toBe(2)
    // Output before the limit is kept, and the limit is the existing one.
    expect(result.length).toBeGreaterThan(1)
    expect(out('while True:\n    pass')).toEqual([
      'Timeout: `while True` never became False. Nothing inside the loop can change it.',
    ])
    expect(
      out('a = 1\nb = 2\nwhile a < b and len([a]) > 0:\n    pass').at(-1),
    ).toBe(
      'Timeout: `while a < b and len([a]) > 0` never became False. Does the loop change `a` or `b`?',
    )
  })

  it('blames the innermost endless loop', () => {
    const code = lines(
      'x = 1',
      'y = 1',
      'while x > 0:',
      '    while y > 0:',
      '        pass',
      '    x -= 1',
    )
    expect(out(code).at(-1)).toBe(
      'Timeout: `while y > 0` never became False. Does the loop change `y`?',
    )
  })

  it('an endless loop inside a function stops the call too', () => {
    const result = runProgram('def spin(n):\n    while n > 0:\n        pass')
    expect(result.error).toBeNull()
    expect(result.call('spin', [int(1)]).error?.message).toBe(
      '`while n > 0` never became False. Does the loop change `n`?',
    )
  })

  it('keeps break, continue and while ... else unsupported', () => {
    expect(out('n = 1\nwhile n > 0:\n    break').at(-1)).toBe(
      'Unsupported: `break` is not part of this terminal yet. Use what the lessons cover.',
    )
    expect(out('n = 1\nwhile n > 0:\n    continue').at(-1)).toBe(
      'Unsupported: `continue` is not part of this terminal yet. Use what the lessons cover.',
    )
    expect(
      out('n = 0\nwhile n > 0:\n    n -= 1\nelse:\n    print("done")').at(-1),
    ).toBe(
      'Unsupported: `while ... else` is not part of this terminal yet. Use what the lessons cover.',
    )
    // Nothing ran: unsupported code is refused before it starts.
    expect(
      out('print("a")\nn = 0\nwhile n > 0:\n    n -= 1\nelse:\n    pass'),
    ).toHaveLength(1)
  })

  it('explains common while syntax mistakes', () => {
    expect(out('n = 1\nwhile n > 0\n    n -= 1').at(-1)).toMatch(
      /^SyntaxError: This line needs a : at the end\./,
    )
    expect(out('n = 1\nwhile n = 0:\n    n -= 1').at(-1)).toMatch(
      /^SyntaxError: Use == to compare/,
    )
    expect(out('n = 1\nwhile n > 0:\nn -= 1').at(-1)).toMatch(
      /^SyntaxError: The lines inside this block need to be indented\./,
    )
  })

  it('cannot be used as a variable name', () => {
    expect(out('while = 3').at(-1)).toMatch(/^SyntaxError/)
  })
})
