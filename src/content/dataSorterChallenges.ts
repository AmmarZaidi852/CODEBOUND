import type { DataSorterChallenge } from '../challenges/dataSorter.ts'

export const dataSorterChallenges: DataSorterChallenge[] = [
  {
    id: 'lists',
    terminal: 'Terminal 01',
    name: 'Score Feed',
    concept: 'Lists',
    lesson:
      'A list stores many values in one variable, in order, inside square brackets: `[12, 18, 7]`. Items are separated by commas.',
    variable: 'scores',
    input: [12, 18, 7, 21],
    showIndexes: false,
    code: ['scores = [12, 18, 7, 21]'],
    instruction:
      'Lists keep items in the order they were written. Tap the score that comes last.',
    task: { kind: 'pick', answerIndex: 3 },
    result: { label: 'scores', values: [12, 18, 7, 21] },
    explanation: {
      steps:
        '`scores` holds four numbers. The last one written, 21, sits at the right-hand end of the list.',
      concept: 'A list is one variable holding several values, in order.',
      mistake:
        'Lists keep their order: the first item is on the left and the last item is on the right.',
    },
  },
  {
    id: 'indexing',
    terminal: 'Terminal 02',
    name: 'Index Probe',
    concept: 'Indexing',
    lesson:
      'Every item has a position called an index. Python starts counting at 0, so the first item is `scores[0]`.',
    variable: 'scores',
    input: [12, 18, 7, 21],
    showIndexes: true,
    code: ['scores = [12, 18, 7, 21]', 'print(scores[2])'],
    instruction: 'Tap the value that `scores[2]` gives back.',
    task: { kind: 'pick', answerIndex: 2 },
    result: { label: 'scores', values: [12, 18, 7, 21] },
    explanation: {
      steps:
        'Index 0 is 12, index 1 is 18, index 2 is 7. So `print(scores[2])` prints 7.',
      concept:
        'Python lists are zero-indexed: index 2 is the third item, and the last index is always one less than the length.',
      mistake:
        'Counting from 1 lands on 18, but Python starts at index 0, so index 2 is the third item.',
    },
  },
  {
    id: 'set-item',
    terminal: 'Terminal 03',
    name: 'Patch Record',
    concept: 'Changing an item',
    lesson:
      '`scores[1] = 20` replaces whatever is at index 1 with 20. The list keeps the same length.',
    variable: 'scores',
    input: [12, 18, 7, 21],
    showIndexes: true,
    code: ['scores = [12, 18, 7, 21]', 'scores[1] = 20'],
    instruction: 'Build `scores` as it looks after line 2 runs.',
    task: {
      kind: 'build',
      pool: [20, 12, 21, 18, 7],
      answer: [12, 20, 7, 21],
      targetLabel: 'scores',
    },
    ops: [{ op: 'set', index: 1, value: 20 }],
    result: { label: 'scores', values: [12, 20, 7, 21] },
    explanation: {
      steps:
        '`scores[1] = 20` swaps the item at index 1 (18) for 20. Nothing else moves.',
      concept: '`list[i] = value` replaces one item in place.',
      mistake:
        'Assignment replaces, it does not insert. 18 is gone, 20 takes its spot at index 1, and the list still has 4 items.',
    },
  },
  {
    id: 'append',
    terminal: 'Terminal 04',
    name: 'Intake Queue',
    concept: 'append()',
    lesson:
      '`append(value)` adds one new item to a list. The list grows by one.',
    variable: 'scores',
    input: [12, 20, 7],
    showIndexes: true,
    code: ['scores = [12, 20, 7]', 'scores.append(25)'],
    instruction: 'Build `scores` after `append(25)` runs.',
    task: {
      kind: 'build',
      pool: [25, 7, 12, 20],
      answer: [12, 20, 7, 25],
      targetLabel: 'scores',
    },
    ops: [{ op: 'append', value: 25 }],
    result: { label: 'scores', values: [12, 20, 7, 25] },
    explanation: {
      steps:
        '`append(25)` adds 25 as a new item at the end. The list grows from 3 items to 4.',
      concept: '`append()` always adds to the end of the list.',
      mistake:
        '`append()` never adds to the front or the middle, and it never replaces anything. The new item always goes on the end.',
    },
  },
  {
    id: 'pop',
    terminal: 'Terminal 05',
    name: 'Purge Slot',
    concept: 'pop()',
    lesson:
      '`pop(i)` removes the item at index `i` and gives it back. The items after it shift left to close the gap.',
    variable: 'scores',
    input: [12, 20, 7, 25],
    showIndexes: true,
    code: ['scores = [12, 20, 7, 25]', 'removed = scores.pop(2)'],
    instruction: 'Tap the item that `scores.pop(2)` removes.',
    task: { kind: 'pick', answerIndex: 2 },
    ops: [{ op: 'pop', index: 2 }],
    result: { label: 'scores', values: [12, 20, 25] },
    explanation: {
      steps:
        '`pop(2)` removes the item at index 2 (7), so `removed` is 7. 25 shifts left, and `scores` becomes `[12, 20, 25]`.',
      concept:
        '`pop(i)` removes the item at index `i`. `pop()` with no index removes the last item.',
      mistake:
        'The 2 in `pop(2)` is an index, counted from 0, so it removes the third item.',
    },
  },
  {
    id: 'combined',
    terminal: 'Terminal 06',
    name: 'Batch Process',
    concept: 'Combining operations',
    lesson:
      'Python runs list operations one line at a time. Each line works on the list as the line before it left it.',
    variable: 'items',
    input: [4, 7, 2],
    showIndexes: true,
    code: [
      'items = [4, 7, 2]',
      'items.append(9)',
      'items.pop(1)',
      'print(items)',
    ],
    instruction: 'Build the list that `print(items)` shows.',
    task: {
      kind: 'build',
      pool: [9, 2, 7, 4],
      answer: [4, 2, 9],
      targetLabel: 'items',
    },
    ops: [
      { op: 'append', value: 9 },
      { op: 'pop', index: 1 },
    ],
    result: { label: 'items', values: [4, 2, 9] },
    explanation: {
      steps:
        '`append(9)` gives `[4, 7, 2, 9]`. Then `pop(1)` removes index 1 (7), leaving `[4, 2, 9]`.',
      concept:
        'Trace the list after every line, top to bottom, before working out the next step.',
      mistake:
        'Take the steps in order. After `append(9)`, index 1 is still 7, so `pop(1)` removes 7 and 9 stays on the end.',
    },
  },
  {
    id: 'for-loop',
    terminal: 'Terminal 07',
    name: 'Signal Doubler',
    concept: 'for loops & len()',
    lesson:
      '`for s in signals:` runs the indented block once for each item, in order, with `s` set to that item. `len(signals)` gives the number of items.',
    variable: 'signals',
    input: [3, 5, 8],
    showIndexes: true,
    code: [
      'signals = [3, 5, 8]',
      '',
      'for s in signals:',
      '    print(s * 2)',
      '',
      'print(len(signals))',
    ],
    instruction: 'Build every value this program prints, in order.',
    task: {
      kind: 'build',
      pool: [16, 3, 6, 5, 10, 8],
      answer: [6, 10, 16, 3],
      targetLabel: 'Printed values',
    },
    result: { label: 'Printed', values: [6, 10, 16, 3] },
    explanation: {
      steps:
        'The loop runs three times: 3 → 6, 5 → 10, 8 → 16. Then `len(signals)` counts the items and prints 3.',
      concept:
        'A `for` loop visits every item in list order. `len()` returns how many items a list has.',
      mistake:
        'Each item is printed doubled, in list order, and then `len()` prints the number of items (3), not the last value.',
    },
  },
]
