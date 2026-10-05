import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import type { CodeChallenge } from '../challenges/code.ts'
import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'
import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'

/*
 * More ADVANCED modules, written so the player has to trace or repair
 * code: state that changes across lines, boolean logic where two answers
 * look plausible, list indexes that shift, and returned values reused.
 * Taught concepts only. They sit after each game's existing ADVANCED
 * modules (never in CORE, so no unlock that a saved game already has can
 * be taken away).
 */

// ── Bug Hunt ─────────────────────────────────────────────────────────────

export const lifeCounter: BugHuntChallenge = {
  id: 'life-counter',
  tier: 'advanced',
  concepts: ['variables', 'operators'],
  concept: 'Updating a variable',
  title: 'Life Counter',
  lesson:
    'A calculation on its own changes nothing. To update a variable, assign the new value back to it: `x = x - 1`.',
  mission: 'The player just lost a life. Print how many lives are left.',
  code: ['lives = 3', 'lives - 1', 'print(lives)'],
  expectedOutput: '2',
  fixes: [
    {
      id: 'a',
      line: 2,
      code: 'lives == lives - 1',
      whyNot:
        '`==` only compares. It works out `3 == 2` (False) and throws it away, so `lives` is still 3.',
    },
    { id: 'b', line: 2, code: 'lives = lives - 1' },
    {
      id: 'c',
      line: 2,
      code: 'lives -= -1',
      whyNot:
        'Taking away minus one adds one: `lives` becomes 4. The life should be taken away.',
    },
    {
      id: 'd',
      line: 1,
      code: 'lives = "3"',
      whyNot:
        'That makes `lives` text, but line 2 still never stores its result, and `"3" - 1` would crash anyway.',
    },
  ],
  correctFixId: 'b',
  explanation: {
    problem:
      'Line 2 works out `3 - 1` and then throws the answer away, so `lives` is still 3.',
    why: 'A variable only changes when something is assigned to it with `=`.',
    fix: '`lives = lives - 1` stores the new count, 2, back in `lives`.',
  },
}

export const scoreBonus: CodeChallenge = {
  kind: 'code',
  id: 'score-bonus',
  tier: 'advanced',
  concepts: ['data-types', 'conditions', 'operators', 'variables'],
  title: 'Score Bonus',
  concept: 'Text, numbers and a condition',
  lesson:
    '`"45"` is text, not a number: Python can\'t compare it with `40` or add `10` to it. `int()` turns text like `"45"` into the number 45.',
  mission:
    'The arcade reads `score` as text. Scores above 40 earn a `bonus` of 10. Fix the program so it prints the final score as a number.',
  goal: '`score = "45"` prints `55`. `"40"` prints `40`. Works for any score.',
  showGiven: true,
  starter: [
    'bonus = 10',
    'if score > 40:',
    '    score = score + bonus',
    'print(score)',
  ],
  tests: [
    { given: { score: '"45"' }, output: ['55'] },
    { given: { score: '"40"' }, output: ['40'] },
    { given: { score: '"41"' }, output: ['51'] },
    { given: { score: '"12"' }, output: ['12'] },
  ],
  requirements: [
    {
      uses: 'int(',
      message:
        'Turn the text into a number with `int()` so the program works for any score.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.error?.kind === 'TypeError',
      message:
        '`score` is still text. Python can\'t compare `"45"` with `40` (or add `10` to it). Turn it into a number with `int()` first.',
    },
    {
      when: (f) => f.test.given?.score === '"40"' && f.output[0] === '50',
      message:
        'A score of exactly 40 got the bonus. Only scores above 40 earn it, so `>=` is too generous.',
    },
    {
      when: (f) => f.test.given?.score === '"45"' && f.output[0] === '45',
      message:
        'The bonus never gets added to 45. Check that the condition and the addition both use the number.',
    },
  ],
  hints: [
    "Two things are wrong with text: it can't be compared with 40, and it can't have 10 added to it.",
    '`int()` turns text like `"45"` into a number. Do that once, at the start, and keep using the number.',
    'Shape: store `int(score)` back in `score` on its own line before the `if`; the rest can stay.',
  ],
  solution: [
    'bonus = 10',
    'score = int(score)',
    'if score > 40:',
    '    score = score + bonus',
    'print(score)',
  ],
  explanation: {
    steps:
      '`int("45")` gives 45. `45 > 40` is `True`, so 10 is added and 55 prints. For `"40"`, `40 > 40` is `False`, so it prints 40 unchanged.',
    concept:
      'Convert text to a number before comparing or doing maths with it.',
  },
}

// ── Code Breaker ─────────────────────────────────────────────────────────

export const twinGates: CodeBreakerChallenge = {
  id: 'twin-gates',
  tier: 'advanced',
  concepts: ['operators', 'conditions', 'data-types'],
  system: 'Twin Gates',
  concept: '`or` versus `and`',
  lesson:
    '`or` is `True` when at least one side is `True`. `and` needs both sides to be `True`. The same two checks can give different answers.',
  rule: 'Gate A lets in adults OR pass holders. Gate B needs an adult AND a pass.',
  state: [
    { name: 'age', value: '17' },
    { name: 'has_pass', value: 'True' },
  ],
  code: [
    'age = 17',
    'has_pass = True',
    '',
    'if age >= 18 or has_pass:',
    '    print("A OPEN")',
    'else:',
    '    print("A LOCKED")',
    '',
    'if age >= 18 and has_pass:',
    '    print("B OPEN")',
    'else:',
    '    print("B LOCKED")',
  ],
  prompt: 'What do the two gates print?',
  options: [
    {
      id: 'a',
      code: 'A OPEN, B OPEN',
      whyNot:
        'Gate B uses `and`. `age >= 18` is `False` (17), so `False and True` is `False`: B stays locked.',
    },
    { id: 'b', code: 'A OPEN, B LOCKED' },
    {
      id: 'c',
      code: 'A LOCKED, B LOCKED',
      whyNot:
        'Gate A uses `or`: being 17 fails the age check, but `has_pass` is `True`, and one `True` side is enough.',
    },
    {
      id: 'd',
      code: 'A LOCKED, B OPEN',
      whyNot:
        'That is the wrong way round. `or` is the easier test to pass, so if any gate opens here it is A.',
    },
  ],
  correctOptionId: 'b',
  explanation: {
    evaluation:
      '`age >= 18` is `False`, `has_pass` is `True`. Gate A: `False or True` is `True` → A OPEN. Gate B: `False and True` is `False` → B LOCKED.',
    concept:
      'Work out each side first, then combine: `or` needs one `True`, `and` needs both.',
  },
}

export const coolingRelay: CodeBreakerChallenge = {
  id: 'cooling-relay',
  tier: 'advanced',
  concepts: ['operators', 'conditions'],
  system: 'Cooling Relay',
  concept: 'elif order and boundaries',
  lesson:
    'An `elif` is only checked when every condition above it was `False`. That means it already knows those cases are ruled out.',
  rule: 'ALERT above 90. WARN from 70 to 90. OK below 70.',
  state: [{ name: 'temp', value: '85' }],
  code: [
    'temp = 85',
    '',
    'if temp > 90:',
    '    print("ALERT")',
    'elif ____:',
    '    print("WARN")',
    'else:',
    '    print("OK")',
  ],
  prompt: 'Which condition matches the rule for every temperature?',
  options: [
    {
      id: 'a',
      code: 'temp > 70',
      whyNot:
        'Right for 85, but at exactly 70 it prints OK. The rule says 70 itself is WARN.',
    },
    { id: 'b', code: 'temp >= 70' },
    {
      id: 'c',
      code: 'temp <= 90',
      whyNot:
        'Right for 85, but 20 is also 90 or less, so a cold relay would print WARN instead of OK.',
    },
    {
      id: 'd',
      code: 'temp >= 70 and temp > 90',
      whyNot:
        'A temperature can only reach the `elif` if it is NOT above 90, so this can never be `True`: 85 prints OK.',
    },
  ],
  correctOptionId: 'b',
  explanation: {
    evaluation:
      'Above 90 is caught by the `if`. Anything that reaches the `elif` is 90 or less, so `temp >= 70` covers exactly 70 to 90. Everything else falls to OK.',
    concept:
      'Each branch only sees what the branches above it let through, so it needs just its lower limit.',
  },
}

// ── Data Sorter ──────────────────────────────────────────────────────────

export const inventoryShuffle: DataSorterChallenge = {
  id: 'inventory-shuffle',
  tier: 'advanced',
  concepts: ['lists', 'indexing'],
  name: 'Inventory Shuffle',
  concept: 'Three operations in a row',
  lesson:
    'Each line changes the list the line before it left. After a `pop`, every later item moves one index to the left.',
  variable: 'crates',
  input: [4, 8, 15],
  showIndexes: true,
  code: [
    'crates = [4, 8, 15]',
    'crates.append(16)',
    'crates.pop(1)',
    'crates[0] = 23',
  ],
  instruction: 'Build `crates` after all three lines run.',
  task: {
    kind: 'build',
    pool: [23, 4, 8, 15, 16],
    answer: [23, 15, 16],
    targetLabel: 'crates',
  },
  ops: [
    { op: 'append', value: 16 },
    { op: 'pop', index: 1 },
    { op: 'set', index: 0, value: 23 },
  ],
  result: { label: 'crates =', values: [23, 15, 16] },
  explanation: {
    steps:
      '`append(16)` → `[4, 8, 15, 16]`. `pop(1)` removes 8 → `[4, 15, 16]`. `crates[0] = 23` replaces 4 → `[23, 15, 16]`.',
    concept:
      'Trace the list after every line; indexes always refer to the list as it is now.',
    mistake:
      'Take it line by line: `pop(1)` removes 8 (index 1 at that moment), then index 0 is still 4, which becomes 23. 16 stays on the end.',
  },
}

export const shiftedSlot: DataSorterChallenge = {
  id: 'shifted-slot',
  tier: 'advanced',
  concepts: ['lists', 'indexing'],
  name: 'Shifted Slot',
  concept: 'Indexes after a pop',
  lesson:
    '`pop(0)` removes the first item, and everything after it moves one place to the left. Old indexes point at new items.',
  variable: 'codes',
  input: [10, 20, 30, 40],
  showIndexes: true,
  code: ['codes = [10, 20, 30, 40]', 'codes.pop(0)', 'print(codes[1])'],
  instruction:
    'The cells show `codes` before the `pop`. Tap the value that `print(codes[1])` shows.',
  task: { kind: 'pick', answerIndex: 2 },
  ops: [{ op: 'pop', index: 0 }],
  result: { label: 'codes =', values: [20, 30, 40] },
  explanation: {
    steps:
      '`pop(0)` removes 10, leaving `[20, 30, 40]`. Now index 1 is 30, so 30 is printed.',
    concept:
      'After removing an item, read indexes from the new list, not the old one.',
    mistake:
      'Index 1 was 20 before the `pop`. After 10 is removed, everything shifts left, so index 1 now holds 30.',
  },
}

export const runningTotal: DataSorterChallenge = {
  id: 'running-total',
  tier: 'advanced',
  concepts: ['lists', 'loops', 'variables', 'operators'],
  name: 'Running Total',
  concept: 'A total that grows in a loop',
  lesson:
    'A variable set before a loop keeps its value between passes, so each pass can add to what the last one left.',
  variable: 'points',
  input: [3, 5, 2],
  showIndexes: false,
  code: [
    'points = [3, 5, 2]',
    'total = 0',
    '',
    'for p in points:',
    '    total = total + p',
    '    print(total)',
  ],
  instruction: 'Build every value this program prints, in order.',
  task: {
    kind: 'build',
    pool: [3, 5, 2, 8, 10, 0],
    answer: [3, 8, 10],
    targetLabel: 'Printed values',
  },
  result: { label: 'Printed values', values: [3, 8, 10] },
  explanation: {
    steps:
      '`total` starts at 0. Pass 1: 0 + 3 = 3. Pass 2: 3 + 5 = 8. Pass 3: 8 + 2 = 10. Each pass prints the new total.',
    concept:
      'The loop body runs once per item, and `total` carries over between passes.',
    mistake:
      'The loop prints `total`, not `p`, and `total` keeps growing: 3, then 3 + 5 = 8, then 8 + 2 = 10.',
  },
}

// ── Function Forge ───────────────────────────────────────────────────────

export const doubleTrace: FunctionForgeChallenge = {
  id: 'double-trace',
  tier: 'advanced',
  concepts: ['functions', 'operators'],
  title: 'Double Trace',
  concept: 'Using two returned values',
  lesson:
    'Each call runs the function again with its own argument. The returned values can then be used like any numbers.',
  instruction: 'Trace both calls before the module runs.',
  code: [
    'def double(x):',
    '    return x * 2',
    '',
    'value = double(5) + double(3)',
  ],
  call: null,
  task: {
    kind: 'choose',
    prompt: 'What does `value` hold?',
    options: [
      {
        id: 'a',
        code: '13',
        whyNot:
          'That doubles only the 5. `double(3)` is its own call, so 3 is doubled too.',
      },
      { id: 'b', code: '16' },
      {
        id: 'c',
        code: '10',
        whyNot:
          '10 is just `double(5)`. The second call, `double(3)`, adds 6 more.',
      },
      {
        id: 'd',
        code: '8',
        whyNot:
          '8 is 5 + 3. Each number goes through `double` first, and the results are added.',
      },
    ],
    correctOptionId: 'b',
  },
  explanation: {
    steps:
      '`double(5)` returns 10. `double(3)` returns 6. Then `10 + 6` is 16, which is stored in `value`.',
    concept:
      'Work out each call to its return value first, then finish the expression.',
    mistake: '',
  },
}

export const bonusChain: FunctionForgeChallenge = {
  id: 'bonus-chain',
  tier: 'advanced',
  concepts: ['functions', 'conditions', 'variables', 'operators'],
  title: 'Bonus Chain',
  concept: 'A returned value that changes the next call',
  lesson:
    'When a returned value is stored back in a variable, the next call sees the new value, so the same function can answer differently.',
  instruction: 'Trace the score through both lines that call `bonus`.',
  code: [
    'def bonus(points):',
    '    if points > 100:',
    '        return 50',
    '    return 10',
    '',
    'score = 90',
    'score = score + bonus(score)',
    'score = score + bonus(score)',
  ],
  call: null,
  task: {
    kind: 'choose',
    prompt: 'What is `score` at the end?',
    options: [
      { id: 'a', code: '110' },
      {
        id: 'b',
        code: '150',
        whyNot:
          'After the first line `score` is exactly 100, and `100 > 100` is `False`, so the second bonus is 10, not 50.',
      },
      {
        id: 'c',
        code: '100',
        whyNot:
          'That stops after the first line. The second line calls `bonus` again and adds another bonus.',
      },
      {
        id: 'd',
        code: '190',
        whyNot:
          'The bonus is 50 or 10, never the score itself. `bonus(90)` returns 10, then `bonus(100)` returns 10.',
      },
    ],
    correctOptionId: 'a',
  },
  explanation: {
    steps:
      '`bonus(90)`: 90 is not over 100, so it returns 10 → `score` is 100. `bonus(100)`: 100 is not over 100 either → 10 more → 110.',
    concept:
      'Each call uses the value the variable has at that moment, and `>` leaves the boundary out.',
    mistake: '',
  },
}

export const powerLimiter: CodeChallenge = {
  kind: 'code',
  id: 'power-limiter',
  tier: 'advanced',
  concepts: ['functions', 'conditions'],
  title: 'Power Limiter',
  concept: 'Writing a function from scratch',
  lesson:
    'A function can decide what to send back: check its parameters with `if`, and `return` a different value in each case.',
  mission:
    'Write `limit(value, top)` from scratch. It returns `value`, but never more than `top`.',
  goal: '`limit(5, 10)` returns `5`, `limit(12, 10)` returns `10`',
  starter: ['# write the limit function here'],
  tests: [
    {
      calls: [
        { fn: 'limit', args: ['5', '10'], returns: '5' },
        { fn: 'limit', args: ['12', '10'], returns: '10' },
        { fn: 'limit', args: ['10', '10'], returns: '10' },
        { fn: 'limit', args: ['0', '3'], returns: '0' },
        { fn: 'limit', args: ['99', '50'], returns: '50' },
      ],
    },
  ],
  mistakes: [
    {
      when: (f) =>
        f.error?.kind === 'NameError' && /limit/.test(f.error.message),
      message:
        'There is no `limit` to call yet. Define it with `def`, its name and both parameters, then an indented body.',
    },
    {
      when: (f) => /returned `None`/.test(f.callMessage ?? ''),
      message:
        'The function ends without sending anything back, so the call gets `None`. Every path needs a `return`.',
    },
    {
      when: (f) => /`limit\(5, 10\)` returned `10`/.test(f.callMessage ?? ''),
      message:
        '`limit(5, 10)` gave back the top instead of 5. Only cap the value when it is bigger than `top`.',
    },
    {
      when: (f) => /`limit\(12, 10\)` returned `12`/.test(f.callMessage ?? ''),
      message:
        '`limit(12, 10)` let 12 through. When `value` is over `top`, return `top` instead.',
    },
  ],
  hints: [
    'Two cases: the value is too big, or it is fine as it is.',
    'An `if` inside the function compares `value` with `top`; each case needs its own `return`.',
    'Shape: a `def` line for `limit` with both parameters → `if value > ___:` returns one thing, otherwise return the other.',
  ],
  solution: [
    'def limit(value, top):',
    '    if value > top:',
    '        return top',
    '    return value',
  ],
  explanation: {
    steps:
      '`limit(12, 10)`: 12 is more than 10, so it returns 10. `limit(5, 10)`: not more, so it skips the `if` and returns 5.',
    concept:
      'A function with an `if` can return different values; whichever `return` runs first ends the function.',
  },
}

/** Every module in this file, for tests. */
export const workshopModules = [
  lifeCounter,
  scoreBonus,
  twinGates,
  coolingRelay,
  inventoryShuffle,
  shiftedSlot,
  runningTotal,
  doubleTrace,
  bonusChain,
  powerLimiter,
]
