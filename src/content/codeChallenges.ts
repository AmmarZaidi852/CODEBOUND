import { valueOf, type CodeChallenge } from '../challenges/code.ts'

/*
 * "Write" modules: the player edits real Python. Each one teaches one idea,
 * is checked by running the code in the controlled simulator against the
 * tests below, and explains the usual mistake without giving the answer.
 */

// ── Bug Hunt ─────────────────────────────────────────────────────────────

export const ticketTotal: CodeChallenge = {
  kind: 'code',
  id: 'ticket-total',
  concepts: ['variables', 'operators'],
  title: 'Ticket Counter',
  concept: 'Arithmetic',
  lesson:
    '`+` adds and `*` multiplies. Python works out the right side of `=` before storing it.',
  mission:
    'Each ticket costs 8. Fix the code so it prints the cost of 3 tickets.',
  goal: 'Prints `24`',
  starter: ['price = 8', 'count = 3', 'total = price + count', 'print(total)'],
  tests: [{ output: ['24'] }],
  requirements: [
    {
      avoids: '24',
      message:
        'Work the total out from `price` and `count` instead of typing 24 yourself.',
    },
    {
      uses: ['price * count', 'count * price'],
      message: 'Calculate the total from `price` and `count` with `*`.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.output[0] === '11',
      message:
        'Your code still adds: `8 + 3` is `11`. Three tickets at 8 each is a multiplication.',
    },
  ],
  hints: [
    'Three tickets that cost 8 each is 8, three times over. Which kind of maths repeats a number?',
    'Python multiplies with `*`.',
    'Only line 3 needs to change: `total = price ___ count`.',
  ],
  solution: ['price = 8', 'count = 3', 'total = price * count', 'print(total)'],
  explanation: {
    steps:
      '`price * count` is `8 * 3`, which is `24`. `total` stores it and `print(total)` shows it.',
    concept:
      '`+` adds and `*` multiplies. Pick the operator that matches the maths.',
  },
}

export const brokenBadge: CodeChallenge = {
  kind: 'code',
  id: 'broken-badge',
  concepts: ['variables', 'data-types'],
  title: 'Broken Badge',
  concept: 'Text and numbers',
  lesson:
    '`+` joins text to text, but not text to a number. `str()` turns a number into text.',
  mission:
    "The badge crashes. Fix it so it prints the player's name and level.",
  goal: 'Prints `Player Sam is level 4`',
  starter: [
    'name = "Sam"',
    'level = 4',
    'print("Player " + name + " is level " + level)',
  ],
  tests: [{ output: ['Player Sam is level 4'] }],
  requirements: [
    {
      uses: ['str(level)', ', level'],
      message:
        'Keep using the `level` variable. Turn it into text with `str(level)` instead of typing the 4.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.error?.kind === 'TypeError',
      message:
        "Python still can't join text and a number with `+`. The number in `level` needs to become text first.",
    },
  ],
  hints: [
    'Read the error: Python cannot add text and a number together.',
    '`str()` turns a value into text: `str(7)` gives `"7"`.',
    'Wrap `level` in `str( )` where it is joined to the text.',
  ],
  solution: [
    'name = "Sam"',
    'level = 4',
    'print("Player " + name + " is level " + str(level))',
  ],
  explanation: {
    steps:
      '`str(level)` turns `4` into `"4"`, so every part of the `+` chain is text and Python can join them.',
    concept:
      'Join text with `+` only after turning numbers into text with `str()`.',
  },
}

// ── Code Breaker ─────────────────────────────────────────────────────────

export const vaultThreshold: CodeChallenge = {
  kind: 'code',
  id: 'vault-threshold',
  concepts: ['operators', 'conditions'],
  title: 'Vault Threshold',
  concept: 'Comparison operators',
  lesson: '`>` means strictly greater. `>=` also includes the number itself.',
  mission:
    'The vault must open when `power` is 50 or more, but it stays shut at exactly 50. Repair the condition.',
  goal: 'Power 50 or more prints `OPEN`. Anything lower prints `LOCKED`.',
  showGiven: true,
  starter: [
    'if power > 50:',
    '    print("OPEN")',
    'else:',
    '    print("LOCKED")',
  ],
  tests: [
    { given: { power: '50' }, output: ['OPEN'] },
    { given: { power: '49' }, output: ['LOCKED'] },
    { given: { power: '80' }, output: ['OPEN'] },
    { given: { power: '0' }, output: ['LOCKED'] },
  ],
  requirements: [
    {
      uses: ['power >= 50', '50 <= power'],
      message:
        'That works for whole numbers, but the rule says "50 or more". Write it with `>=` and 50.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.test.given?.power === '50' && f.output[0] === 'LOCKED',
      message:
        'At `power = 50` the vault stays LOCKED. `>` leaves 50 out, so you need an operator that includes 50 itself.',
    },
  ],
  hints: [
    'The rule says "50 or more". Does `>` include 50?',
    'Python has an operator meaning "greater than or equal to".',
    'Change only the operator on line 1. It is two characters long.',
  ],
  solution: [
    'if power >= 50:',
    '    print("OPEN")',
    'else:',
    '    print("LOCKED")',
  ],
  explanation: {
    steps:
      'With `power = 50`, `power >= 50` is `True`, so the vault opens. At 49 it is `False` and the `else` branch runs.',
    concept: 'Use `>=` or `<=` when the boundary number itself should count.',
  },
}

export const accessRule: CodeChallenge = {
  kind: 'code',
  id: 'access-rule',
  concepts: ['operators', 'conditions'],
  title: 'Access Rule',
  concept: 'and',
  lesson: '`and` is `True` only when both sides are `True`.',
  mission:
    'Write the condition: grant access only when `pin` is 1234 AND `level` is 3 or higher.',
  goal: 'The right PIN with level 3+ prints `ACCESS GRANTED`. Anything else prints `ACCESS DENIED`.',
  showGiven: true,
  starter: [
    'if ____:',
    '    print("ACCESS GRANTED")',
    'else:',
    '    print("ACCESS DENIED")',
  ],
  tests: [
    { given: { pin: '1234', level: '3' }, output: ['ACCESS GRANTED'] },
    { given: { pin: '1234', level: '2' }, output: ['ACCESS DENIED'] },
    { given: { pin: '1111', level: '5' }, output: ['ACCESS DENIED'] },
    { given: { pin: '1234', level: '7' }, output: ['ACCESS GRANTED'] },
    { given: { pin: '0', level: '0' }, output: ['ACCESS DENIED'] },
  ],
  mistakes: [
    {
      when: (f) => f.tokens.includes('or'),
      message:
        'With `or`, one correct part is enough to get in. The rule needs both, so join them with `and`.',
    },
    {
      when: (f) => !f.tokens.includes('level'),
      message: 'Your condition never checks `level`. The rule has two parts.',
    },
    {
      when: (f) => !f.tokens.includes('pin'),
      message: 'Your condition never checks `pin`. The rule has two parts.',
    },
    {
      when: (f) =>
        f.test.given?.level === '3' && f.output[0] === 'ACCESS DENIED',
      message:
        'A level of exactly 3 is denied. "3 or higher" includes 3 itself.',
    },
  ],
  hints: [
    'Two things must both be true: the PIN and the level.',
    'Join two comparisons with `and`. Check the PIN with `==` and the level with `>=`.',
    'The shape is `pin == ____ and level >= ____`.',
  ],
  solution: [
    'if pin == 1234 and level >= 3:',
    '    print("ACCESS GRANTED")',
    'else:',
    '    print("ACCESS DENIED")',
  ],
  explanation: {
    steps:
      'With `pin = 1234` and `level = 3`, both sides are `True`, so `and` gives `True`. If either side is `False`, the whole condition is `False`.',
    concept: 'Use `and` when every part of a rule must hold.',
  },
}

// ── Data Sorter ──────────────────────────────────────────────────────────

export const fixReading: CodeChallenge = {
  kind: 'code',
  id: 'fix-reading',
  concepts: ['lists', 'indexing'],
  title: 'Fix the Reading',
  concept: 'Changing an item',
  lesson:
    '`readings[1] = 30` replaces the item at index 1. Indexes start at 0.',
  mission:
    'The sensor misread the second reading. Change it to `30` without rebuilding the list.',
  goal: '`readings` ends as `[41, 30, 38]`',
  listVariable: 'readings',
  starter: ['readings = [41, 12, 38]'],
  tests: [{ vars: { readings: '[41, 30, 38]' } }],
  requirements: [
    {
      uses: '] =',
      message:
        'The list is right, but you rebuilt it. Change the one item in place with an index: `readings[?] = 30`.',
    },
  ],
  mistakes: [
    {
      when: (f) => valueOf(f, 'readings') === '[41, 12, 30]',
      message:
        'You changed index 2, which is the third item. The second reading is at index 1, because indexes start at 0.',
    },
    {
      when: (f) => valueOf(f, 'readings') === '[30, 12, 38]',
      message:
        'You changed index 0, the first item. The second reading is one place further along.',
    },
    {
      when: (f) => f.error?.kind === 'IndexError',
      message:
        'That index is past the end of the list. `readings` only has indexes 0, 1 and 2.',
    },
  ],
  hints: [
    'The second item is not at index 2. Where do Python indexes start?',
    'Put an index in square brackets on the left of `=` to replace one item.',
    'Add a line like `readings[_] = 30` with the right index.',
  ],
  solution: ['readings = [41, 12, 38]', 'readings[1] = 30'],
  explanation: {
    steps:
      '`readings[1] = 30` replaces the item at index 1 (`12`) with `30`. The other items stay where they are.',
    concept: '`list[index] = value` changes one item in place.',
  },
}

export const queueIntake: CodeChallenge = {
  kind: 'code',
  id: 'queue-intake',
  concepts: ['lists'],
  title: 'Queue Intake',
  concept: 'append()',
  lesson: '`queue.append(25)` adds 25 to the end of `queue`.',
  mission: 'A new job, `25`, has arrived. Add it to the end of `queue`.',
  goal: '`queue` ends as `[12, 18, 7, 25]`',
  listVariable: 'queue',
  starter: ['queue = [12, 18, 7]'],
  tests: [{ vars: { queue: '[12, 18, 7, 25]' } }],
  requirements: [
    {
      uses: 'queue.append(',
      message:
        'The list is right, but you rebuilt it by hand. Use `append()` to add to the existing list.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.error?.kind === 'IndexError',
      message:
        "`queue[3]` doesn't exist yet, so it can't be assigned. `append()` makes the list longer.",
    },
    {
      when: (f) => valueOf(f, 'queue') === '[12, 18, 25]',
      message:
        'You replaced the last job instead of adding a new one. `append()` adds without removing anything.',
    },
  ],
  hints: [
    'Lists have a method that adds one item to the end.',
    'Methods go after a dot: `queue.something(value)`.',
    'Call `append` on `queue` with the new job inside the brackets.',
  ],
  solution: ['queue = [12, 18, 7]', 'queue.append(25)'],
  explanation: {
    steps:
      '`queue.append(25)` adds `25` after the last item, so `queue` grows from 3 items to 4.',
    concept: '`append()` adds one item to the end of a list.',
  },
}

// ── Function Forge ───────────────────────────────────────────────────────

export const doubler: CodeChallenge = {
  kind: 'code',
  id: 'write-double',
  concepts: ['functions', 'operators'],
  title: 'Doubler',
  concept: 'return',
  lesson: '`return` sends a value back to the code that called the function.',
  mission: 'Finish `double` so it returns its input times 2.',
  goal: '`double(4)` returns `8`, and it works for any number',
  starter: ['def double(x):', '    pass'],
  tests: [
    {
      calls: [
        { fn: 'double', args: ['4'], returns: '8' },
        { fn: 'double', args: ['0'], returns: '0' },
        { fn: 'double', args: ['-3'], returns: '-6' },
      ],
    },
  ],
  mistakes: [
    {
      when: (f) =>
        f.tokens.some((t, i) => t === 'return' && f.tokens[i + 1] === '8') &&
        !f.tokens.includes('x', f.tokens.indexOf('return')),
      message:
        'Your function always returns 8. Use the parameter `x`, so it works for any number.',
    },
  ],
  hints: [
    'Use the parameter `x` inside the function.',
    'Replace `pass` with a `return` line.',
    'Return `x` multiplied by 2.',
  ],
  solution: ['def double(x):', '    return x * 2'],
  explanation: {
    steps:
      '`double(4)` puts `4` into `x`. `return x * 2` sends `8` back to the caller.',
    concept: 'A function gives its result back with `return`.',
  },
}

export const adder: CodeChallenge = {
  kind: 'code',
  id: 'write-add',
  concepts: ['functions', 'operators'],
  title: 'Adder',
  concept: 'Multiple parameters',
  lesson:
    'List parameters in the brackets, separated by commas: `def name(a, b):`.',
  mission:
    'Define a function `add` that takes two numbers and returns their sum.',
  goal: '`add(2, 3)` returns `5`',
  starter: ['# Define add here'],
  tests: [
    {
      calls: [
        { fn: 'add', args: ['2', '3'], returns: '5' },
        { fn: 'add', args: ['10', '-4'], returns: '6' },
        { fn: 'add', args: ['0', '0'], returns: '0' },
      ],
    },
  ],
  mistakes: [
    {
      when: (f) => /takes \d argument/.test(f.error?.message ?? ''),
      message:
        'Your `add` has the wrong number of parameters. It needs exactly two, separated by a comma.',
    },
  ],
  hints: [
    'Start with `def`, the name `add`, and the parameters in brackets.',
    'Two parameters, like `(a, b)`. End the line with `:`.',
    'On the next line, indented, return the two parameters added together.',
  ],
  solution: ['def add(a, b):', '    return a + b'],
  explanation: {
    steps:
      '`add(2, 3)` puts `2` into `a` and `3` into `b`, then `return a + b` sends back `5`.',
    concept: 'Each parameter receives one argument, in order.',
  },
}

export const useIt: CodeChallenge = {
  kind: 'code',
  id: 'write-call',
  concepts: ['functions'],
  title: 'Use It',
  concept: 'Calling a function',
  lesson:
    'Call a function by its name with arguments in brackets. `print(f(...))` shows what it returns.',
  mission:
    '`area` is ready. Use it to print the area of a room 4 wide and 6 long.',
  goal: 'Prints `24`',
  starter: ['def area(w, h):', '    return w * h', ''],
  tests: [{ output: ['24'] }],
  requirements: [
    {
      avoids: '24',
      message: "Let `area` do the maths. Don't type the 24 yourself.",
    },
    {
      uses: [
        'print(area(4, 6))',
        'print(area(6, 4))',
        '= area(4, 6)',
        '= area(6, 4)',
      ],
      message: "Call `area` with the room's width and length, 4 and 6.",
    },
  ],
  mistakes: [
    {
      when: (f) => f.output.length === 0 && !f.error,
      message:
        'Nothing was printed. A call like `area(4, 6)` returns the answer, but you still need `print( )` to show it.',
    },
  ],
  hints: [
    'A function only runs when you call it.',
    'Call `area` with two arguments: the width, then the length.',
    'Print what it returns: `print(area(…, …))`.',
  ],
  solution: ['def area(w, h):', '    return w * h', 'print(area(4, 6))'],
  explanation: {
    steps:
      '`area(4, 6)` runs the function with `w = 4` and `h = 6`. It returns `24`, and `print` shows it.',
    concept: 'Define a function once, then call it with the values you need.',
  },
}
