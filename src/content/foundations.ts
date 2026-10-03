import type { Concept } from '../challenges/foundations.ts'

/** Python Foundations, in learning order. */
export const foundations: Concept[] = [
  {
    id: 'variables',
    title: 'Variables',
    summary:
      'A variable is a name that stores a value so you can use it later.',
    example: ['score = 100', 'score = score + 50', 'print(score)'],
    exampleNote:
      '`=` stores the value on the right in the name on the left. Line 2 reads `score`, adds 50, and stores the result back in `score`.',
    micro: {
      kind: 'choice',
      prompt: 'What does this example print?',
      options: [
        {
          id: 'a',
          code: '100',
          whyNot:
            'Line 2 updates `score` before it is printed, so the old value 100 is gone.',
        },
        { id: 'b', code: '150' },
        {
          id: 'c',
          code: 'score',
          whyNot:
            'Without quotes, `print(score)` prints the value stored in the variable, not its name.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation:
      '`score` starts at 100. Line 2 replaces it with 100 + 50, so `print(score)` shows 150.',
    game: 'bug-hunt',
  },
  {
    id: 'data-types',
    title: 'Data types',
    summary:
      'Every value has a type: whole numbers are `int`, decimals are `float`, text is `str`, and `True` / `False` are `bool`.',
    example: [
      'age = 15          # int',
      'price = 4.99      # float',
      'name = "Ada"      # str',
      'is_member = True  # bool',
    ],
    exampleNote:
      'Quotes make a string. `"15"` is text, but `15` is a number you can do maths with.',
    micro: {
      kind: 'choice',
      prompt: 'What is the type of `"42"`?',
      options: [
        {
          id: 'a',
          code: 'int',
          whyNot: 'It looks like a number, but the quotes make it text.',
        },
        { id: 'b', code: 'str' },
        {
          id: 'c',
          code: 'float',
          whyNot: 'A `float` is a number with a decimal point, like `4.2`.',
        },
        {
          id: 'd',
          code: 'bool',
          whyNot: 'Only `True` and `False` are `bool` values.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation:
      'Anything inside quotes is a string, even digits. `int("42")` would convert it to the number 42.',
    game: 'bug-hunt',
  },
  {
    id: 'operators',
    title: 'Operators',
    summary:
      'Operators combine values: `+ - * /` do maths, and comparisons like `==`, `>` and `<=` answer `True` or `False`.',
    example: ['total = 3 + 4 * 2', 'print(total)', 'print(total > 10)'],
    exampleNote:
      '`*` runs before `+`, so `total` is 11. `11 > 10` is a comparison, so the last line prints `True`.',
    micro: {
      kind: 'choice',
      prompt: 'What does `print(10 == 5 * 2)` show?',
      options: [
        {
          id: 'a',
          code: '10',
          whyNot:
            '`==` compares two values. The result is `True` or `False`, never a number.',
        },
        { id: 'b', code: 'True' },
        {
          id: 'c',
          code: 'False',
          whyNot: '`5 * 2` is 10, and `10 == 10` is equal, so this is `True`.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation:
      '`5 * 2` is worked out first (10). Then `10 == 10` asks whether they are equal: `True`.',
    game: 'code-breaker',
  },
  {
    id: 'conditions',
    title: 'Conditions',
    summary:
      '`if` runs a block of code only when its condition is `True`, and `else` runs when it is not.',
    later:
      "You'll use conditions alone first, then combine them with lists, loops and functions in Advanced and Boss modules.",
    example: [
      'energy = 30',
      '',
      'if energy > 50:',
      '    print("Run")',
      'else:',
      '    print("Rest")',
    ],
    exampleNote:
      '`30 > 50` is `False`, so Python skips the `if` block and runs `else`, printing Rest.',
    micro: {
      kind: 'choice',
      prompt: 'Change line 1 to `energy = 80`. What prints now?',
      options: [
        { id: 'a', code: 'Run' },
        {
          id: 'b',
          code: 'Rest',
          whyNot:
            '`80 > 50` is `True`, so the `if` block runs instead of `else`.',
        },
        {
          id: 'c',
          code: 'Run then Rest',
          whyNot: 'Only one branch of an `if / else` ever runs, never both.',
        },
      ],
      correctOptionId: 'a',
    },
    explanation:
      '`80 > 50` is `True`, so the `if` block prints Run and `else` is skipped.',
    game: 'code-breaker',
  },
  {
    id: 'lists',
    title: 'Lists',
    summary:
      'A list holds several values in order inside square brackets, and `len()` tells you how many there are.',
    later:
      'Lists come back in Advanced and Boss modules, combined with loops and conditions to filter and count data.',
    example: ['colors = ["red", "green", "blue"]', 'print(len(colors))'],
    exampleNote:
      'The list has three items separated by commas, so `len(colors)` prints 3.',
    micro: {
      kind: 'choice',
      prompt: 'What does `len([4, 8, 15, 16])` return?',
      options: [
        {
          id: 'a',
          code: '3',
          whyNot: 'Count every value between the brackets: there are four.',
        },
        { id: 'b', code: '4' },
        {
          id: 'c',
          code: '16',
          whyNot:
            '16 is the last value. `len()` counts items, it does not read them.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation:
      'The list has four items (4, 8, 15, 16), so `len()` returns 4.',
    game: 'data-sorter',
  },
  {
    id: 'indexing',
    title: 'Indexing',
    summary:
      'Each item in a list has an index, and Python starts counting at 0.',
    example: [
      'letters = ["a", "b", "c"]',
      'print(letters[0])  # a',
      'print(letters[2])  # c',
    ],
    exampleNote:
      'Index 0 is the first item. The last index is always one less than the length.',
    micro: {
      kind: 'pick',
      prompt: 'Tap the value of `nums[1]`.',
      list: { label: 'nums =', values: [5, 10, 15, 20] },
      answerIndex: 1,
      whyNot:
        'Counting starts at 0, so index 1 is the second item, not the first.',
    },
    explanation: 'Index 0 is 5 and index 1 is 10, so `nums[1]` is 10.',
    game: 'data-sorter',
  },
  {
    id: 'loops',
    title: 'Loops',
    summary:
      'A `for` loop runs the same block of code once for each item in a list.',
    later:
      'In Advanced and Boss modules, loops team up with conditions and lists: counting matches, filtering data, adding totals.',
    example: ['for n in [1, 2, 3]:', '    print(n * 10)'],
    exampleNote:
      '`n` takes each value in turn, so this prints 10, then 20, then 30.',
    micro: {
      kind: 'choice',
      prompt: 'How many times does `print(x)` run?',
      code: ['for x in [7, 7, 7, 7]:', '    print(x)'],
      options: [
        {
          id: 'a',
          code: '1',
          whyNot:
            'The loop runs once per item, even when the values are the same.',
        },
        { id: 'b', code: '4' },
        {
          id: 'c',
          code: '7',
          whyNot: '7 is the value of each item, not how many items there are.',
        },
      ],
      correctOptionId: 'b',
    },
    explanation:
      'The list has four items, so the loop body runs four times (printing 7 each time).',
    game: 'data-sorter',
  },
  {
    id: 'functions',
    title: 'Functions',
    summary:
      'A function is a named block of code you define once with `def` and run whenever you call it.',
    later:
      'Advanced and Boss modules put conditions, loops and lists inside functions.',
    example: [
      'def greet():',
      '    print("Hello")',
      '',
      'def add(a, b):',
      '    return a + b',
      '',
      'greet()            # prints Hello',
      'total = add(2, 3)',
    ],
    exampleNote:
      '`def` creates a function. `a` and `b` are parameters that receive the values you pass in. `return` sends a result back. Writing `add(2, 3)` calls it.',
    micro: {
      kind: 'choice',
      prompt: 'What does `add(2, 3)` return?',
      options: [
        { id: 'a', code: '5' },
        {
          id: 'b',
          code: '23',
          whyNot:
            '2 and 3 are numbers, so `+` adds them. Gluing them into "23" only happens with strings.',
        },
        {
          id: 'c',
          code: 'a + b',
          whyNot:
            '`return` sends back the value of `a + b`, not the text of the expression.',
        },
        {
          id: 'd',
          code: 'None',
          whyNot:
            'A function returns `None` only when it has no `return`. This one returns `a + b`.',
        },
      ],
      correctOptionId: 'a',
    },
    explanation:
      'Calling `add(2, 3)` sets `a` to 2 and `b` to 3, so `return a + b` sends back 5.',
    game: 'function-forge',
  },
]
