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
      'while True:\n    pass',
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
