import type { BugHuntChallenge } from '../challenges/bugHunt.ts'

export const bugHuntChallenges: BugHuntChallenge[] = [
  {
    id: 'variables',
    concept: 'Variables',
    title: 'The Missing Score',
    lesson:
      'A variable is a name that stores a value. Names are case-sensitive: `score` and `Score` are two different names.',
    mission: "Print the player's score.",
    code: ['score = 10', 'print(Score)'],
    expectedOutput: '10',
    fixes: [
      {
        id: 'a',
        line: 1,
        code: 'score == 10',
        whyNot:
          '`==` compares values, it does not store one. Now `score` is never created.',
      },
      { id: 'b', line: 2, code: 'print(score)' },
      {
        id: 'c',
        line: 2,
        code: 'print("Score")',
        whyNot:
          'Quotes make a string, so this prints the word Score instead of the value 10.',
      },
    ],
    correctFixId: 'b',
    explanation: {
      problem: 'Line 2 uses `Score` with a capital S.',
      why: 'Python treats `Score` as a different name that was never defined, so it raises a `NameError`.',
      fix: 'With a lowercase s, Python finds the variable that holds 10 and prints it.',
    },
  },
  {
    id: 'arithmetic',
    concept: 'Arithmetic',
    title: 'Average Disaster',
    lesson:
      'Python follows maths order: `*` and `/` happen before `+` and `-`. Use parentheses `( )` to make something happen first.',
    mission: 'Print the average of a and b.',
    code: ['a = 8', 'b = 4', 'average = a + b / 2', 'print(average)'],
    expectedOutput: '6.0',
    fixes: [
      {
        id: 'a',
        line: 3,
        code: 'average = a + (b / 2)',
        whyNot:
          'The parentheses still divide only `b`. This is 8 + 2, which prints 10.0.',
      },
      {
        id: 'b',
        line: 3,
        code: 'average = a + b // 2',
        whyNot:
          '`//` is floor division, but it still happens before `+`. This prints 10.',
      },
      { id: 'c', line: 3, code: 'average = (a + b) / 2' },
    ],
    correctFixId: 'c',
    explanation: {
      problem: 'Line 3 divides only `b` by 2, giving 8 + 2 = 10.0.',
      why: 'Division runs before addition, so `a + b / 2` means `a + (b / 2)`.',
      fix: '`(a + b) / 2` adds first, then divides: 12 / 2 = 6.0.',
    },
  },
  {
    id: 'strings',
    concept: 'Strings & print',
    title: 'Glitched Nameplate',
    lesson:
      'Text in quotes is a string. `+` can join strings together, but it cannot join a string and a number. Convert numbers with `str()` first.',
    mission: "Print the player's nameplate.",
    code: ['name = "Ada"', 'level = 3', 'print(name + " is level " + level)'],
    expectedOutput: 'Ada is level 3',
    fixes: [
      { id: 'a', line: 3, code: 'print(name + " is level " + str(level))' },
      {
        id: 'b',
        line: 3,
        code: 'print(name + " is level " + "level")',
        whyNot:
          '`"level"` in quotes is the word level, not the variable. This prints "Ada is level level".',
      },
      {
        id: 'c',
        line: 2,
        code: 'level = "three"',
        whyNot:
          'That removes the error, but prints "Ada is level three" instead of 3.',
      },
    ],
    correctFixId: 'a',
    explanation: {
      problem: 'Line 3 tries to join a string and the number `level`.',
      why: 'Python will not guess how to mix text and numbers with `+`, so it raises a `TypeError`.',
      fix: '`str(level)` turns 3 into the text "3", so everything is a string and joins cleanly.',
    },
  },
  {
    id: 'booleans',
    concept: 'Booleans',
    title: 'Gate Malfunction',
    lesson:
      'Comparisons like `age >= 13` give `True` or `False`. `and` is True only if both sides are True. `or` is True if either side is.',
    mission:
      'Players may enter only if they are 13 or older AND have a ticket. This player has no ticket.',
    code: [
      'age = 15',
      'has_ticket = False',
      'can_enter = age >= 13 or has_ticket',
      'print(can_enter)',
    ],
    expectedOutput: 'False',
    fixes: [
      {
        id: 'a',
        line: 3,
        code: 'can_enter = age > 13 or has_ticket',
        whyNot:
          'Still uses `or`. 15 > 13 is True, so the player gets in without a ticket.',
      },
      {
        id: 'b',
        line: 2,
        code: 'has_ticket = True',
        whyNot:
          'That changes the player, not the rule. The gate logic is still wrong.',
      },
      { id: 'c', line: 3, code: 'can_enter = age >= 13 and has_ticket' },
    ],
    correctFixId: 'c',
    explanation: {
      problem: 'Line 3 uses `or`, so being old enough is enough to get in.',
      why: '`True or False` is `True`. The rule needs both conditions to be true.',
      fix: '`and` requires both: `True and False` is `False`, so the gate stays shut.',
    },
  },
  {
    id: 'if-else',
    concept: 'if / else',
    title: 'Broken Lock',
    lesson:
      '`if` runs a block only when its condition is True, and `else` runs otherwise. Use `==` to compare. A single `=` assigns a value.',
    mission: 'Grant access only when the password matches.',
    code: [
      'password = "python123"',
      'if password = "python123":',
      '    print("Access granted")',
      'else:',
      '    print("Access denied")',
    ],
    expectedOutput: 'Access granted',
    fixes: [
      {
        id: 'a',
        line: 2,
        code: 'if password != "python123":',
        whyNot:
          '`!=` means "not equal". The passwords match, so this prints "Access denied".',
      },
      { id: 'b', line: 2, code: 'if password == "python123":' },
      {
        id: 'c',
        line: 2,
        code: 'if password == python123:',
        whyNot:
          'Without quotes, `python123` is treated as a variable name that does not exist. This is a `NameError`.',
      },
    ],
    correctFixId: 'b',
    explanation: {
      problem: 'Line 2 uses `=` inside the `if` condition.',
      why: '`=` assigns a value and cannot be used as a condition, so Python reports a `SyntaxError`.',
      fix: '`==` compares the two strings. They match, so the `if` block prints "Access granted".',
    },
  },
]
