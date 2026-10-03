import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'

/** A Python string literal like "Alex" → Alex, or null if it is not quoted. */
function unquote(literal: string): string | null {
  return /^".*"$/.test(literal) ? literal.slice(1, -1) : null
}

export const functionForgeChallenges: FunctionForgeChallenge[] = [
  {
    id: 'define',
    concepts: ['functions'],
    title: 'Define It',
    concept: 'def',
    lesson:
      'A function is defined with `def`, then its name, parentheses, and a colon. The indented lines below are its body.',
    instruction:
      'Forge the header for the `greet` module. Its body is already in place.',
    code: ['____', '    return "Hello"'],
    call: null,
    task: {
      kind: 'assemble',
      tokens: ['greet', ':', 'if', 'def', ')', '(', 'function'],
      answer: ['def', 'greet', '(', ')', ':'],
    },
    explanation: {
      steps:
        '`def` starts the definition, `greet` is its name, `()` holds its parameters (none here), and `:` opens the body.',
      concept:
        'Every function header has the same shape: `def name():`. The body is indented underneath.',
      mistake:
        'A header is always `def`, then the name, then parentheses, then a colon. `function` and `if` are not part of it.',
    },
  },
  {
    id: 'call',
    concepts: ['functions'],
    title: 'Call It',
    concept: 'Calling a function',
    lesson:
      'Defining a function only stores it. Nothing runs until you call it by writing its name followed by parentheses.',
    instruction:
      'The `greet` module is defined but idle. Fill the last line so it runs.',
    code: ['def greet():', '    return "Hello"', '', '____'],
    call: { name: 'greet', args: [], output: 'Hello' },
    task: {
      kind: 'choose',
      prompt: 'Which line runs `greet`?',
      options: [
        {
          id: 'a',
          code: 'greet',
          whyNot:
            'This only names the function. Without `()` Python does not run it.',
        },
        { id: 'b', code: 'greet()' },
        {
          id: 'c',
          code: 'def greet()',
          whyNot:
            '`def` defines a function. It does not run one, and this line is missing its colon and body.',
        },
        {
          id: 'd',
          code: 'return greet',
          whyNot: '`return` only works inside a function body.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation: {
      steps:
        '`greet()` jumps into the function, runs `return "Hello"`, and comes back with `"Hello"`.',
      concept:
        'Define once with `def`, then call with `name()` as many times as you like.',
      mistake: '',
    },
  },
  {
    id: 'one-parameter',
    concepts: ['functions'],
    title: 'One Parameter',
    concept: 'Parameters & arguments',
    lesson:
      'A parameter is a name in the definition, like `name` in `greet(name)`. The value you pass when calling is the argument.',
    instruction: 'Send an argument so the module outputs `Hello Alex`.',
    code: ['def greet(name):', '    return "Hello " + name', '', 'greet(____)'],
    call: { name: 'greet', args: ['"Alex"'], output: 'Hello Alex' },
    task: {
      kind: 'args',
      params: ['name'],
      tiles: ['Alex', '"Hello"', '"Alex"'],
      answer: ['"Alex"'],
      target: 'Hello Alex',
      run: ([name]) => {
        const text = unquote(name)
        return text === null
          ? `NameError: name '${name}' is not defined`
          : `Hello ${text}`
      },
    },
    explanation: {
      steps:
        'Calling `greet("Alex")` sets `name` to `"Alex"`, so `"Hello " + name` becomes `Hello Alex`.',
      concept:
        'Parameters are the inputs a function expects. Arguments are the actual values you send in.',
      mistake:
        'Text needs quotes. `Alex` without quotes is treated as a variable name that does not exist.',
    },
  },
  {
    id: 'return',
    concepts: ['functions', 'operators'],
    title: 'Return',
    concept: 'return',
    lesson:
      '`return` sends a value back to whoever called the function. Without it, the function gives back `None`.',
    instruction: 'Complete `add` so that `total` ends up holding 10.',
    code: ['def add(a, b):', '    ____', '', 'total = add(4, 6)'],
    call: { name: 'add', args: ['4', '6'], output: '10' },
    task: {
      kind: 'choose',
      prompt: 'Which body line makes `total` equal 10?',
      options: [
        {
          id: 'a',
          code: 'print(a + b)',
          whyNot:
            'This shows 10 on screen, but the function still returns `None`, so `total` is `None`.',
        },
        { id: 'b', code: 'return a + b' },
        {
          id: 'c',
          code: 'a + b',
          whyNot:
            'Python works out 10 and then throws it away. Without `return`, the call gives back `None`.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation: {
      steps:
        '`add(4, 6)` sets `a = 4` and `b = 6`. `return a + b` sends back 10, which is stored in `total`.',
      concept:
        '`print` shows a value. `return` hands it back so the caller can store or use it.',
      mistake: '',
    },
  },
  {
    id: 'multiple-parameters',
    concepts: ['functions', 'operators'],
    title: 'Two Inputs',
    concept: 'Multiple parameters',
    lesson:
      'Functions can take several parameters. Arguments fill them in order: the first argument goes to the first parameter.',
    instruction: 'Send two arguments so `subtract` outputs `7`.',
    code: [
      'def subtract(a, b):',
      '    return a - b',
      '',
      'result = subtract(____)',
    ],
    call: { name: 'subtract', args: ['10', '3'], output: '7' },
    task: {
      kind: 'args',
      params: ['a', 'b'],
      tiles: ['3', '7', '10', '4'],
      answer: ['10', '3'],
      target: '7',
      run: ([a, b]) => String(Number(a) - Number(b)),
    },
    explanation: {
      steps:
        '`subtract(10, 3)` sets `a = 10` and `b = 3`, so `a - b` returns 7.',
      concept:
        'Argument order matters: values are matched to parameters by position.',
      mistake:
        'Order matters. `subtract(3, 10)` sets `a = 3` and returns -7. The bigger number must come first here.',
    },
  },
  {
    id: 'predict',
    concepts: ['functions', 'operators'],
    title: 'Trace It',
    concept: 'Tracing a function',
    lesson:
      'To predict a call, replace each parameter with its argument and work out the `return` line.',
    instruction: 'The module is sealed. Predict its output before it runs.',
    code: ['def double(x):', '    return x * 2', '', 'double(7)'],
    call: { name: 'double', args: ['7'], output: '14' },
    task: {
      kind: 'choose',
      prompt: 'What does `double(7)` return?',
      options: [
        {
          id: 'a',
          code: '9',
          whyNot: '`x * 2` multiplies by 2. It does not add 2.',
        },
        { id: 'b', code: '14' },
        { id: 'c', code: '49', whyNot: '49 would be `x * x`, not `x * 2`.' },
        {
          id: 'd',
          code: '"77"',
          whyNot:
            '`"7" * 2` would repeat a string, but 7 here is a number, so it is multiplied.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation: {
      steps:
        '`x` becomes 7, so `return x * 2` becomes `return 7 * 2`, which is 14.',
      concept:
        'Tracing means substituting the arguments, then evaluating the `return` line.',
      mistake: '',
    },
  },
  {
    id: 'build',
    concepts: ['functions', 'operators'],
    title: 'Forge It',
    concept: 'Building a function',
    lesson:
      'A full function is a header (`def`, name, parameters, colon) plus a body that returns the result.',
    instruction:
      'Forge `area`, taking `w` then `h`, so that `area(3, 5)` returns 15.',
    code: ['____'],
    call: { name: 'area', args: ['3', '5'], output: '15' },
    task: {
      kind: 'assemble',
      tokens: [
        'w + h',
        'h',
        ':',
        'return',
        'def',
        ',',
        'print',
        'area',
        ')',
        'w',
        'w * h',
        '(',
      ],
      answer: ['def', 'area', '(', 'w', ',', 'h', ')', ':', 'return', 'w * h'],
    },
    explanation: {
      steps:
        '`def area(w, h):` takes two inputs. `return w * h` multiplies them, so `area(3, 5)` returns 15.',
      concept:
        'Header first, then a body that `return`s the result. The parameters are the names the body uses.',
      mistake:
        'Build the header `def area(w, h):` first, then the body `return w * h`. `w + h` would return 8, and `print` would return `None`.',
    },
  },
]
