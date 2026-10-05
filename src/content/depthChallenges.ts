import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import { valueOf, type CodeChallenge } from '../challenges/code.ts'
import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'
import type { DataSorterChallenge } from '../challenges/dataSorter.ts'
import type { FunctionForgeChallenge } from '../challenges/functionForge.ts'

/*
 * ADVANCED and BOSS modules. Each one combines concepts the player has
 * already met in Foundations and the game's CORE modules; none introduces
 * new Python. ADVANCED combines two or more ideas, a BOSS several in one
 * program. More ADVANCED modules live in workshopChallenges.ts.
 */

// ── Bug Hunt ─────────────────────────────────────────────────────────────

export const memberDiscount: BugHuntChallenge = {
  id: 'member-discount',
  tier: 'advanced',
  concepts: ['variables', 'conditions', 'data-types'],
  concept: 'Conditions + text',
  title: 'Member Discount',
  lesson:
    'An `if` can change a variable before it is used. Whatever it ends up holding still has to be turned into text with `str()` before it is joined to text.',
  mission: 'Members get 10 off. Print the member price.',
  code: [
    'price = 40',
    'member = True',
    'if member:',
    '    price = price - 10',
    'print("Total: " + price)',
  ],
  expectedOutput: 'Total: 30',
  fixes: [
    {
      id: 'a',
      line: 4,
      code: '    price = price - "10"',
      whyNot:
        'Now the subtraction mixes a number and text, so it fails one line earlier. The discount was already correct.',
    },
    {
      id: 'b',
      line: 2,
      code: 'member = "True"',
      whyNot:
        'That changes `member`, not the crash. Line 5 still joins the text `"Total: "` to the number in `price`.',
    },
    { id: 'c', line: 5, code: 'print("Total: " + str(price))' },
    {
      id: 'd',
      line: 3,
      code: 'if not member:',
      whyNot:
        'That stops members getting the discount, and line 5 still joins text to a number, so it still crashes.',
    },
  ],
  correctFixId: 'c',
  explanation: {
    problem:
      'Line 5 joins the text `"Total: "` to the number in `price`, which Python refuses.',
    why: 'The `if` correctly lowers `price` to 30, but it is still a number. `+` can only join text to text.',
    fix: '`str(price)` turns 30 into `"30"` after the discount has been applied.',
  },
}

export const averageScore: CodeChallenge = {
  kind: 'code',
  id: 'average-score',
  tier: 'advanced',
  concepts: ['variables', 'operators', 'data-types'],
  title: 'Average Score',
  concept: 'Order of operations + text',
  lesson:
    'Python does `*` and `/` before `+` and `-`; brackets change the order. `/` always gives a decimal number, like `8.0`.',
  mission:
    'Two bugs are tangled together here. Fix the program so it prints the average of `a` and `b`.',
  goal: 'Prints `Average: 8.0`',
  starter: [
    'a = 7',
    'b = 9',
    'average = a + b / 2',
    'print("Average: " + average)',
  ],
  tests: [{ output: ['Average: 8.0'] }],
  requirements: [
    {
      avoids: '8.0',
      message: 'Calculate the average from `a` and `b` instead of typing 8.0.',
    },
    {
      uses: ['(a + b) / 2', '(b + a) / 2'],
      message:
        'Work the average out from `a` and `b`: add them first, then divide by 2.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.error?.kind === 'TypeError',
      message:
        "Python reaches the last line and can't join text and a number with `+`. The number in `average` needs `str()`.",
    },
    {
      when: (f) => f.output[0] === 'Average: 11.5',
      message:
        'It runs, but prints 11.5. Python divides before it adds, so `a + b / 2` is `7 + 4.5`. Make the addition happen first.',
    },
  ],
  hints: [
    'There are two problems: the maths, and joining a number to text.',
    'Brackets make Python do the addition first. `str()` turns a number into text.',
    'Line 3 needs brackets around the sum; line 4 needs `str(average)`.',
  ],
  solution: [
    'a = 7',
    'b = 9',
    'average = (a + b) / 2',
    'print("Average: " + str(average))',
  ],
  explanation: {
    steps:
      '`(a + b) / 2` is `16 / 2`, which is `8.0`. `str(average)` turns it into `"8.0"`, so the text can be joined.',
    concept:
      'Check both what a line calculates and what type the result is before you use it.',
  },
}

export const shopCheckout: CodeChallenge = {
  kind: 'code',
  id: 'shop-checkout',
  tier: 'boss',
  concepts: ['variables', 'operators', 'conditions', 'data-types'],
  title: 'Shop Checkout',
  concept: 'Reading a whole program',
  lesson:
    'Read a program top to bottom and ask what each line should hold. One wrong line can hide another.',
  mission:
    'Each item costs `price`. Orders of 30 or more get 5 off. The checkout gets it wrong in more than one place. Repair it so every order prints the right message.',
  goal: 'For 3 items at 12, prints `You pay 31`. Works for any order.',
  showGiven: true,
  starter: [
    'total = price + quantity',
    'if total > 30:',
    '    total = total - 5',
    'print("You pay " + total)',
  ],
  tests: [
    { given: { price: '12', quantity: '3' }, output: ['You pay 31'] },
    { given: { price: '10', quantity: '3' }, output: ['You pay 25'] },
    { given: { price: '5', quantity: '2' }, output: ['You pay 10'] },
    { given: { price: '15', quantity: '2' }, output: ['You pay 25'] },
    { given: { price: '7', quantity: '4' }, output: ['You pay 28'] },
  ],
  mistakes: [
    {
      when: (f) => f.error?.kind === 'TypeError',
      message:
        'The checkout crashes on the last line: it joins text and a number. That is one problem, but not the only one.',
    },
    {
      when: (f) => f.test.given?.price === '12' && f.output[0] === 'You pay 15',
      message:
        'For 3 items at 12 the total comes out as 15. `price + quantity` adds them, but several items at one price is a multiplication.',
    },
    {
      when: (f) => f.test.given?.price === '12' && f.output[0] === 'You pay 36',
      message:
        'The total is right before the discount (36), but the 5 off never happens. Check the condition.',
    },
    {
      when: (f) => f.test.given?.price === '10' && f.output[0] === 'You pay 30',
      message:
        'An order of exactly 30 should get the discount, but it pays 30. `>` leaves 30 out.',
    },
  ],
  hints: [
    'Check three things: how the total is calculated, which totals get the discount, and how the message is built.',
    'Multiply for several items; `>=` includes the boundary; `str()` turns a number into text.',
    'Lines 1, 2 and 4 each need one change. Line 3 is already right.',
  ],
  solution: [
    'total = price * quantity',
    'if total >= 30:',
    '    total = total - 5',
    'print("You pay " + str(total))',
  ],
  explanation: {
    steps:
      '3 × 12 = 36, which is 30 or more, so 5 comes off: 31. `str(total)` makes it text for the message. An order of exactly 30 now gets the discount too.',
    concept:
      'Debugging a whole program means checking each line against what it should do, not just fixing the first error.',
  },
}

// ── Code Breaker ─────────────────────────────────────────────────────────

export const overrideSwitch: CodeBreakerChallenge = {
  id: 'override-switch',
  tier: 'advanced',
  concepts: ['operators', 'conditions'],
  system: 'Override Switch',
  concept: 'Grouping and / or / not',
  lesson:
    'Brackets are worked out first. `not` flips one value. `and` needs both sides `True`; `or` needs at least one.',
  rule: 'The door opens for a badge OR the manual override, as long as the alarm is NOT ringing.',
  state: [
    { name: 'badge', value: 'False' },
    { name: 'override', value: 'True' },
    { name: 'alarm', value: 'False' },
  ],
  code: [
    'badge = False',
    'override = True',
    'alarm = False',
    '',
    'if (badge or override) and not alarm:',
    '    print("DOOR OPEN")',
    'else:',
    '    print("DOOR SHUT")',
  ],
  prompt: 'What does the door panel print?',
  options: [
    { id: 'a', code: 'DOOR OPEN' },
    {
      id: 'b',
      code: 'DOOR SHUT',
      whyNot:
        '`badge` is `False`, but `badge or override` only needs one of them, and `override` is `True`. The alarm is off, so `not alarm` is `True` too.',
    },
    {
      id: 'c',
      code: 'Nothing',
      whyNot:
        'With an `else` branch, exactly one of the two `print` lines always runs.',
    },
  ],
  correctOptionId: 'a',
  explanation: {
    evaluation:
      '`(False or True)` is `True`. `not False` is `True`. `True and True` is `True`, so the door opens.',
    concept:
      'Work out the brackets first, then `not`, then `and`. Each part matches one piece of the rule.',
  },
}

export const shiftScheduler: CodeChallenge = {
  kind: 'code',
  id: 'shift-scheduler',
  tier: 'advanced',
  concepts: ['operators', 'conditions'],
  title: 'Shift Scheduler',
  concept: 'if / elif / else + ranges',
  lesson:
    'Python checks `if`, then each `elif`, top to bottom, and runs only the first branch that is `True`. Join two comparisons with `and` to check a range.',
  mission:
    'Print `DAY` for hours 8 to 17, `NIGHT` for hours 18 to 23, and `CLOSED` for any other hour.',
  goal: '`hour = 12` prints `DAY`, `20` prints `NIGHT`, `3` prints `CLOSED`',
  showGiven: true,
  starter: [
    'if hour >= 8:',
    '    print("DAY")',
    'else:',
    '    print("CLOSED")',
  ],
  tests: [
    { given: { hour: '12' }, output: ['DAY'] },
    { given: { hour: '8' }, output: ['DAY'] },
    { given: { hour: '17' }, output: ['DAY'] },
    { given: { hour: '18' }, output: ['NIGHT'] },
    { given: { hour: '23' }, output: ['NIGHT'] },
    { given: { hour: '3' }, output: ['CLOSED'] },
    { given: { hour: '0' }, output: ['CLOSED'] },
  ],
  mistakes: [
    {
      when: (f) => f.test.given?.hour === '18' && f.output[0] === 'DAY',
      message:
        'At `hour = 18` you print DAY. Your DAY check catches every hour from 8 up, so later hours never reach a NIGHT branch. Give DAY an upper limit too.',
    },
    {
      when: (f) => !f.tokens.includes('elif') && f.output[0] !== 'NIGHT',
      message:
        'There are three outcomes, so you need a third branch. Add an `elif` for the night hours.',
    },
    {
      when: (f) => f.test.given?.hour === '17' && f.output[0] !== 'DAY',
      message: 'Hour 17 should still be DAY. "8 to 17" includes 17 itself.',
    },
    {
      when: (f) => f.test.given?.hour === '3' && f.output[0] === 'NIGHT',
      message:
        'Hour 3 prints NIGHT, but night is only 18 to 23. Early-morning hours are CLOSED.',
    },
  ],
  hints: [
    'There are three outcomes, so you need three branches: `if`, `elif` and `else`.',
    'A range like "8 to 17" is two comparisons joined with `and`.',
    'The shape is `if hour >= 8 and hour <= __:` then `elif hour >= __:` then `else:`.',
  ],
  solution: [
    'if hour >= 8 and hour <= 17:',
    '    print("DAY")',
    'elif hour >= 18:',
    '    print("NIGHT")',
    'else:',
    '    print("CLOSED")',
  ],
  explanation: {
    steps:
      'For `hour = 20`, `20 >= 8 and 20 <= 17` is `False`, so Python tries the `elif`: `20 >= 18` is `True`, so it prints NIGHT and skips the `else`.',
    concept:
      'Order branches so each one only catches what it should; use `and` to give a branch both a lower and an upper limit.',
  },
}

export const vaultCore: CodeChallenge = {
  kind: 'code',
  id: 'vault-core',
  tier: 'boss',
  concepts: ['variables', 'operators', 'conditions'],
  title: 'Vault Core',
  concept: 'Multi-state access control',
  lesson:
    'When rules compete, the order of your branches decides which one wins. Brackets keep `or` parts together inside an `and`.',
  mission:
    'Write the vault logic. 1) After 3 or more `attempts`, print `ALARM`, no matter what. 2) Otherwise, the right `code` (7291) with a `key` OR the `override` prints `OPEN`. 3) Anything else prints `DENIED`.',
  goal: 'Every combination of code, attempts, key and override gives the right outcome',
  showGiven: true,
  starter: [
    'if code == 7291 and key:',
    '    print("OPEN")',
    'else:',
    '    print("DENIED")',
  ],
  tests: [
    {
      given: { code: '7291', attempts: '0', key: 'True', override: 'False' },
      output: ['OPEN'],
    },
    {
      given: { code: '7291', attempts: '1', key: 'False', override: 'True' },
      output: ['OPEN'],
    },
    {
      given: { code: '7291', attempts: '0', key: 'False', override: 'False' },
      output: ['DENIED'],
    },
    {
      given: { code: '1111', attempts: '0', key: 'True', override: 'True' },
      output: ['DENIED'],
    },
    {
      given: { code: '7291', attempts: '3', key: 'True', override: 'False' },
      output: ['ALARM'],
    },
    {
      given: { code: '1111', attempts: '5', key: 'False', override: 'False' },
      output: ['ALARM'],
    },
    {
      given: { code: '7291', attempts: '2', key: 'True', override: 'True' },
      output: ['OPEN'],
    },
  ],
  mistakes: [
    {
      when: (f) =>
        f.test.given?.override === 'True' &&
        f.test.given.code === '7291' &&
        f.output[0] === 'DENIED',
      message:
        'The code is right and the override is on, but the vault stays shut. A key OR the override should be enough.',
    },
    {
      when: (f) => f.test.given?.code === '1111' && f.output[0] === 'OPEN',
      message:
        'A wrong code opened the vault. Python does `and` before `or`, so group the key and override part with brackets.',
    },
    {
      when: (f) => f.test.given?.attempts === '3' && f.output[0] !== 'ALARM',
      message:
        'After 3 attempts the vault must raise the ALARM, even with the right code. Check `attempts` before anything else.',
    },
    {
      when: (f) => f.test.given?.attempts === '2' && f.output[0] === 'ALARM',
      message: '2 attempts is still allowed. The alarm is for 3 or more.',
    },
  ],
  hints: [
    'Three outcomes means three branches. The alarm beats everything, so it goes first.',
    'Use `>=` for "3 or more", and brackets to keep `key or override` together inside an `and`.',
    'The shape is `if attempts ...:` → ALARM, `elif code == 7291 and (...):` → OPEN, `else:` → DENIED.',
  ],
  solution: [
    'if attempts >= 3:',
    '    print("ALARM")',
    'elif code == 7291 and (key or override):',
    '    print("OPEN")',
    'else:',
    '    print("DENIED")',
  ],
  explanation: {
    steps:
      'With `attempts = 3` the first branch runs and nothing else is checked. With fewer attempts, `code == 7291` must be `True` and so must `(key or override)`. Otherwise the `else` prints DENIED.',
    concept:
      'Put the rule that must always win first, and use brackets so `or` groups exactly what the rule says.',
  },
}

// ── Data Sorter ──────────────────────────────────────────────────────────

export const thresholdFilter: DataSorterChallenge = {
  id: 'threshold-filter',
  tier: 'advanced',
  concepts: ['lists', 'loops', 'conditions'],
  name: 'Threshold Filter',
  concept: 'Loops + conditions',
  lesson:
    'An `if` inside a loop runs once for every item, so the loop can pick out only the items that match.',
  variable: 'readings',
  input: [12, 30, 7, 45, 18],
  showIndexes: false,
  code: [
    'readings = [12, 30, 7, 45, 18]',
    '',
    'for r in readings:',
    '    if r > 15:',
    '        print(r)',
  ],
  instruction: 'Build every value this program prints, in order.',
  task: {
    kind: 'build',
    pool: [7, 45, 15, 12, 18, 30],
    answer: [30, 45, 18],
    targetLabel: 'Printed values',
  },
  result: { label: 'Printed values', values: [30, 45, 18] },
  explanation: {
    steps:
      'The loop visits 12, 30, 7, 45 and 18 in order. Only 30, 45 and 18 are greater than 15, so only they are printed.',
    concept:
      'A loop visits every item; the `if` inside it decides which ones to act on.',
    mistake:
      'Only readings greater than 15 are printed, and in list order: 12 and 7 are skipped, and 15 never appears in the list.',
  },
}

export const countAlerts: CodeChallenge = {
  kind: 'code',
  id: 'count-alerts',
  tier: 'advanced',
  concepts: ['lists', 'loops', 'conditions', 'variables'],
  title: 'Count Alerts',
  concept: 'Counting with a loop',
  lesson:
    'To count matches, start a variable at 0 and add 1 inside the loop each time the condition is `True`. Print once, after the loop.',
  mission: 'Count how many readings are above 15, then print the count once.',
  goal: 'Prints `3`',
  listVariable: 'readings',
  starter: ['readings = [12, 30, 7, 45, 18]', 'alerts = 0', ''],
  tests: [{ output: ['3'], vars: { alerts: '3' } }],
  requirements: [
    {
      uses: 'for',
      message:
        'Count with a `for` loop over `readings` instead of working it out yourself.',
    },
    {
      uses: ['alerts += 1', 'alerts = alerts + 1'],
      message:
        'Add 1 to `alerts` inside the loop each time a reading is above 15.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.output.length > 1,
      message:
        'The count is printed on every pass of the loop. Print once, after the loop: take the `print` out of the indented block.',
    },
    {
      when: (f) => f.output[0] === '5',
      message:
        'You counted every reading. Only add 1 when the reading is above 15.',
    },
    {
      when: (f) => f.output[0] === '2',
      message:
        'Your loop counts the readings of 15 or less. The condition is reversed.',
    },
    {
      when: (f) => f.output[0] === '0',
      message:
        '`alerts` never changes. Add 1 to it inside the loop when the reading is above 15.',
    },
  ],
  hints: [
    'Visit each reading with a loop, and add 1 to `alerts` when one is above 15.',
    'An `if` goes inside the `for` block, and the line that adds 1 to `alerts` goes inside the `if`. `+=` adds to a variable.',
    'Shape: `for __ in readings:` → `if __ > 15:` → add 1 to `alerts`. Then print the count once, with no indent.',
  ],
  solution: [
    'readings = [12, 30, 7, 45, 18]',
    'alerts = 0',
    'for r in readings:',
    '    if r > 15:',
    '        alerts += 1',
    'print(alerts)',
  ],
  explanation: {
    steps:
      'The loop checks each reading. 30, 45 and 18 are above 15, so `alerts` goes 0 → 1 → 2 → 3. After the loop, `print(alerts)` shows 3.',
    concept:
      'Counter pattern: start at 0, add 1 inside an `if` in the loop, use the total after the loop.',
  },
}

export const sensorRepair: CodeChallenge = {
  kind: 'code',
  id: 'sensor-repair',
  tier: 'boss',
  concepts: ['lists', 'loops', 'conditions', 'operators'],
  title: 'Sensor Repair',
  concept: 'Filtering a list',
  lesson:
    'Build a new list by looping over the old one and `append`ing only the items you keep. `len()` tells you how many items a list has.',
  mission:
    'Readings above 100 are glitches. Put every reading of 100 or less into `clean`, in order. Then print how many glitches were removed.',
  goal: '`clean` ends as `[42, 77, 99, 100]` and the program prints `2`',
  listVariable: 'readings',
  resultVariable: 'clean',
  starter: ['readings = [42, 180, 77, 250, 99, 100]', 'clean = []', ''],
  tests: [{ vars: { clean: '[42, 77, 99, 100]' }, output: ['2'] }],
  requirements: [
    {
      uses: 'clean.append(',
      message:
        'Build `clean` with `append()` inside a loop, so it works for any readings.',
    },
    {
      uses: 'len(',
      message:
        'Work out the number removed with `len()` instead of typing it: compare the two lists.',
    },
  ],
  mistakes: [
    {
      when: (f) => valueOf(f, 'clean') === '[42, 77, 99]',
      message:
        '100 is missing from `clean`. Only readings above 100 are glitches, so 100 itself stays.',
    },
    {
      when: (f) =>
        valueOf(f, 'clean') === '[180, 250]' ||
        valueOf(f, 'clean') === '[180, 250, 100]',
      message:
        'Your `clean` list keeps the glitches and drops the good readings. The condition is reversed.',
    },
    {
      when: (f) => valueOf(f, 'clean') === '[]',
      message:
        '`clean` is still empty. Inside the loop, `append` each reading you keep.',
    },
    {
      when: (f) =>
        valueOf(f, 'clean') === '[42, 77, 99, 100]' && f.output[0] === '4',
      message:
        '`clean` is right, but you printed how many readings were kept (4). The goal is how many were removed.',
    },
    {
      when: (f) =>
        valueOf(f, 'clean') === '[42, 77, 99, 100]' && f.output.length === 0,
      message: '`clean` is right. Now print how many glitches were removed.',
    },
  ],
  hints: [
    'Loop over `readings`; keep a reading if it is 100 or less. The number removed is the difference in length.',
    'Inside the loop, an `if` with `<=` keeps the good readings, and `clean.append(...)` adds one. `len()` gives the length of a list.',
    'Shape: `for __ in readings:` → `if __ <= ___:` → `clean.append(__)`. After the loop, print one length minus the other.',
  ],
  solution: [
    'readings = [42, 180, 77, 250, 99, 100]',
    'clean = []',
    'for r in readings:',
    '    if r <= 100:',
    '        clean.append(r)',
    'print(len(readings) - len(clean))',
  ],
  explanation: {
    steps:
      'The loop keeps 42, 77, 99 and 100 and skips 180 and 250. `clean` has 4 items, `readings` has 6, so `6 - 4` prints 2.',
    concept:
      'Filter pattern: start an empty list, loop, and `append` only what passes the condition.',
  },
}

// ── Function Forge ───────────────────────────────────────────────────────

export const feeCalculator: FunctionForgeChallenge = {
  id: 'fee-calculator',
  tier: 'advanced',
  concepts: ['functions', 'conditions', 'operators'],
  title: 'Fee Calculator',
  concept: 'Functions + conditions',
  lesson:
    'A function can choose what to return with an `if`. The first `return` that runs ends the function.',
  instruction: 'Trace the call before the module runs.',
  code: [
    'def fee(age):',
    '    if age < 12:',
    '        return 5',
    '    return 9',
    '',
    'fee(12)',
  ],
  call: { name: 'fee', args: ['12'], output: '9' },
  task: {
    kind: 'choose',
    prompt: 'What does `fee(12)` return?',
    options: [
      {
        id: 'a',
        code: '5',
        whyNot:
          '`12 < 12` is `False`, so `return 5` is skipped. Only ages under 12 pay 5.',
      },
      { id: 'b', code: '9' },
      {
        id: 'c',
        code: '14',
        whyNot:
          'The function never adds anything. It returns one of two fixed fees.',
      },
      {
        id: 'd',
        code: 'None',
        whyNot:
          'When the `if` is `False`, Python carries on to `return 9`, so a value always comes back.',
      },
    ],
    correctOptionId: 'b',
  },
  explanation: {
    steps:
      '`age` is 12. `12 < 12` is `False`, so the `if` block is skipped and `return 9` runs.',
    concept:
      'Inside a function, an `if` can decide which value comes back. The first `return` reached wins.',
    mistake: '',
  },
}

export const scoreTotal: CodeChallenge = {
  kind: 'code',
  id: 'score-total',
  tier: 'advanced',
  concepts: ['functions', 'lists', 'loops', 'operators'],
  title: 'Score Total',
  concept: 'Functions + loops',
  lesson:
    'A function can take a whole list as its parameter and loop over it. Return the answer after the loop has finished.',
  mission:
    'Finish `total` so it returns the sum of every score in the list it is given.',
  goal: '`total([4, 6, 10])` returns `20`',
  starter: [
    'def total(scores):',
    '    result = 0',
    '    # add every score to result',
    '    return result',
  ],
  tests: [
    {
      calls: [
        { fn: 'total', args: ['[4, 6, 10]'], returns: '20' },
        { fn: 'total', args: ['[]'], returns: '0' },
        { fn: 'total', args: ['[7]'], returns: '7' },
        { fn: 'total', args: ['[1, 2, 3, 4]'], returns: '10' },
      ],
    },
  ],
  requirements: [
    {
      uses: 'for',
      message: 'Add the scores up with a `for` loop, so it works for any list.',
    },
  ],
  mistakes: [
    {
      when: (f) =>
        /`total\(\[4, 6, 10\]\)` returned `0`/.test(f.callMessage ?? ''),
      message:
        'The loop never adds anything to `result`, so it stays 0. Add each score to `result` inside the loop.',
    },
    {
      when: (f) =>
        /`total\(\[4, 6, 10\]\)` returned `10`/.test(f.callMessage ?? ''),
      message:
        '`result` ends as the last score only. Add each score to it instead of replacing it.',
    },
    {
      when: (f) =>
        /`total\(\[4, 6, 10\]\)` returned `4`/.test(f.callMessage ?? ''),
      message:
        'The function returns during the first pass of the loop. Move `return` after the loop (less indented).',
    },
  ],
  hints: [
    'Visit each score with a loop and add it to `result`.',
    'A `for` loop over `scores` visits each one; `result += ...` adds a score to the total.',
    'Put the loop between `result = 0` and `return result`, indented inside the function.',
  ],
  solution: [
    'def total(scores):',
    '    result = 0',
    '    for s in scores:',
    '        result += s',
    '    return result',
  ],
  explanation: {
    steps:
      'For `[4, 6, 10]`, `result` goes 0 → 4 → 10 → 20. After the loop, `return result` sends back 20. An empty list skips the loop and returns 0.',
    concept:
      'A function that loops over its list parameter can return a total built up during the loop.',
  },
}

export const shippingRule: CodeChallenge = {
  kind: 'code',
  id: 'shipping-rule',
  tier: 'boss',
  concepts: ['functions', 'operators', 'conditions'],
  title: 'Shipping Rule',
  concept: 'A function with rules',
  lesson:
    'A function can check its parameters with `if`, calculate with them, and return the result. Decide which rule must win first.',
  mission:
    'Write `shipping(weight, express)`. Normal shipping costs 2 per kg. Express costs double. Any order over 20 kg costs a flat 50, express or not.',
  goal: '`shipping(3, False)` returns `6`, `shipping(3, True)` returns `12`, `shipping(25, True)` returns `50`',
  starter: ['def shipping(weight, express):', '    pass'],
  tests: [
    {
      calls: [
        { fn: 'shipping', args: ['3', 'False'], returns: '6' },
        { fn: 'shipping', args: ['3', 'True'], returns: '12' },
        { fn: 'shipping', args: ['20', 'False'], returns: '40' },
        { fn: 'shipping', args: ['20', 'True'], returns: '80' },
        { fn: 'shipping', args: ['21', 'False'], returns: '50' },
        { fn: 'shipping', args: ['25', 'True'], returns: '50' },
        { fn: 'shipping', args: ['0', 'True'], returns: '0' },
      ],
    },
  ],
  mistakes: [
    {
      when: (f) =>
        /`shipping\(3, True\)` returned `6`/.test(f.callMessage ?? ''),
      message:
        'Express orders cost the same as normal ones. Express should double the price.',
    },
    {
      when: (f) =>
        /`shipping\(21, False\)` returned `42`/.test(f.callMessage ?? ''),
      message:
        'A 21 kg order costs 42, but orders over 20 kg should cost a flat 50. Check the weight first.',
    },
    {
      when: (f) =>
        /`shipping\(20, False\)` returned `50`/.test(f.callMessage ?? ''),
      message: '20 kg is not over 20. The flat price only starts above 20.',
    },
    {
      when: (f) =>
        /`shipping\(25, True\)` returned `100`/.test(f.callMessage ?? ''),
      message:
        'The flat 50 applies to express orders too. Check the weight first and return 50 straight away.',
    },
  ],
  hints: [
    'Three rules: heavy orders are flat, otherwise 2 per kg, and express doubles it. The flat rule must win.',
    'Check the weight first and send back the flat price straight away for heavy orders. Then use an `if` on `express`.',
    'Shape: `if weight __ 20:` returns 50; an `if` on `express` returns double the normal price; otherwise return the normal price.',
  ],
  solution: [
    'def shipping(weight, express):',
    '    if weight > 20:',
    '        return 50',
    '    if express:',
    '        return weight * 4',
    '    return weight * 2',
  ],
  explanation: {
    steps:
      '`shipping(25, True)`: 25 is over 20, so it returns 50 at once. `shipping(3, True)`: not heavy, express, so 3 × 4 = 12. `shipping(3, False)`: 3 × 2 = 6.',
    concept:
      'Check the rule that overrides the others first, then calculate; each `return` ends the function.',
  },
}
