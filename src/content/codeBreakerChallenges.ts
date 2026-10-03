import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'

export const codeBreakerChallenges: CodeBreakerChallenge[] = [
  {
    id: 'basic-if',
    system: 'Keypad Lock',
    concept: 'if',
    lesson:
      '`if` runs its indented block only when the condition is `True`. `==` asks "are these equal?" and answers `True` or `False`.',
    rule: 'The door opens when the entered code equals 42.',
    state: [{ name: 'code', value: '42' }],
    code: ['code = 42', '', 'if ____:', '    print("UNLOCKED")'],
    prompt: 'Which condition unlocks the door?',
    options: [
      {
        id: 'a',
        code: 'code = 42',
        whyNot:
          'A single `=` stores a value. It is not a question, so Python rejects it inside an `if` with a `SyntaxError`.',
      },
      {
        id: 'b',
        code: 'code == "42"',
        whyNot:
          '`"42"` in quotes is text. The number 42 never equals the string "42", so this is `False` and the door stays shut.',
      },
      { id: 'c', code: 'code == 42' },
    ],
    correctOptionId: 'c',
    explanation: {
      evaluation:
        '`code == 42` becomes `42 == 42`, which is `True`, so the `if` block runs and prints UNLOCKED.',
      concept:
        '`=` stores a value. `==` compares two values and gives back `True` or `False`.',
    },
  },
  {
    id: 'comparisons',
    system: 'Clearance Scanner',
    concept: 'Comparison operators',
    lesson:
      '`==` equal · `!=` not equal · `>` greater than · `<` less than · `>=` greater than or equal · `<=` less than or equal.',
    rule: 'Access requires a clearance level of 5 or higher.',
    state: [{ name: 'clearance', value: '7' }],
    code: ['clearance = 7', '', 'if ____:', '    print("ACCESS GRANTED")'],
    prompt: 'Which condition matches the rule exactly?',
    options: [
      {
        id: 'a',
        code: 'clearance > 5',
        whyNot:
          'True for 7, but `>` leaves out 5 itself. A guard with clearance exactly 5 would be blocked even though the rule allows them.',
      },
      { id: 'b', code: 'clearance >= 5' },
      {
        id: 'c',
        code: 'clearance <= 5',
        whyNot:
          'This points the wrong way: it lets in levels 5 and below. `7 <= 5` is `False`, so the scanner stays locked.',
      },
      {
        id: 'd',
        code: 'clearance != 5',
        whyNot:
          'True for 7, but also True for 1, 2, 3, ... Almost anyone gets in, and level 5 is locked out.',
      },
    ],
    correctOptionId: 'b',
    explanation: {
      evaluation:
        '`clearance >= 5` becomes `7 >= 5`, which is `True`. Level 5 also passes, exactly as the rule says.',
      concept:
        '"Or higher" includes the number itself, so it needs `>=`. Test the edge case (here, 5) to catch off-by-one mistakes.',
    },
  },
  {
    id: 'if-elif-else',
    system: 'Reactor Monitor',
    concept: 'if / elif / else',
    lesson:
      'Python checks `if` and each `elif` from top to bottom and runs only the first branch whose condition is `True`. `else` runs if none of them are.',
    rule: 'The monitor reports the reactor status based on its heat.',
    state: [{ name: 'heat', value: '75' }],
    code: [
      'heat = 75',
      '',
      'if heat > 90:',
      '    print("MELTDOWN")',
      'elif heat > 60:',
      '    print("WARNING")',
      'else:',
      '    print("STABLE")',
    ],
    prompt: 'What does the monitor print?',
    options: [
      {
        id: 'a',
        code: 'MELTDOWN',
        whyNot: '`75 > 90` is `False`, so the first branch is skipped.',
      },
      { id: 'b', code: 'WARNING' },
      {
        id: 'c',
        code: 'STABLE',
        whyNot:
          '`else` only runs when every condition above it is `False`. Here `75 > 60` is `True`, so Python never reaches `else`.',
      },
      {
        id: 'd',
        code: 'WARNING then STABLE',
        whyNot:
          'Only one branch of an `if / elif / else` ever runs. Once a condition is `True`, Python skips the rest.',
      },
    ],
    correctOptionId: 'b',
    explanation: {
      evaluation:
        '`75 > 90` is `False`, so move on. `75 > 60` is `True`, so it prints WARNING and skips `else`.',
      concept:
        'Branches are checked in order and exactly one runs. Order matters: put the most specific check first.',
    },
  },
  {
    id: 'and-or',
    system: 'Two-Factor Gate',
    concept: 'and / or',
    lesson:
      '`and` is `True` only when both sides are `True`. `or` is `True` when at least one side is. `not` flips `True` to `False` and back.',
    rule: 'Entry needs BOTH the correct PIN (1234) AND access level 3 or higher.',
    state: [
      { name: 'pin', value: '1234' },
      { name: 'level', value: '2' },
    ],
    code: [
      'pin = 1234',
      'level = 2',
      '',
      'if pin == 1234 ____ level >= 3:',
      '    print("ACCESS GRANTED")',
      'else:',
      '    print("ACCESS DENIED")',
    ],
    prompt: 'Which operator enforces the rule?',
    options: [
      {
        id: 'a',
        code: 'or',
        whyNot:
          '`or` needs only one side to be `True`. The correct PIN alone would let this level 2 user in.',
      },
      { id: 'b', code: 'and' },
      {
        id: 'c',
        code: 'not',
        whyNot:
          '`not` flips a single value. It cannot join two conditions, so this line is a `SyntaxError`.',
      },
    ],
    correctOptionId: 'b',
    explanation: {
      evaluation:
        '`pin == 1234` is `True` and `level >= 3` is `False`. `True and False` is `False`, so the gate prints ACCESS DENIED, which is the right call for level 2.',
      concept:
        'Use `and` when every requirement must be met, and `or` when any one is enough.',
    },
  },
  {
    id: 'combined',
    system: 'Core Mainframe',
    concept: 'Combined logic',
    lesson:
      'Conditions can be chained: `a and b and not c`. Python applies `not` first, then `and`, then `or`, so mixing `and` with `or` can change the meaning.',
    rule: 'Grant core access when the PIN is 7319 AND the level is 3 or higher, but NEVER if the account is locked out.',
    state: [
      { name: 'pin', value: '7319' },
      { name: 'level', value: '3' },
      { name: 'locked_out', value: 'False' },
    ],
    code: [
      'pin = 7319',
      'level = 3',
      'locked_out = False',
      '',
      'if ____:',
      '    print("CORE ACCESS GRANTED")',
      'else:',
      '    print("ACCESS DENIED")',
    ],
    prompt: 'Which condition implements every part of the rule?',
    options: [
      {
        id: 'a',
        code: 'pin == 7319 or level >= 3 and not locked_out',
        whyNot:
          '`and` is evaluated before `or`, so the correct PIN on its own is enough, even for a locked-out account.',
      },
      {
        id: 'b',
        code: 'pin == 7319 and level > 3 and not locked_out',
        whyNot:
          '`level > 3` leaves out level 3. This user is level 3 and should get in, but `3 > 3` is `False`.',
      },
      { id: 'c', code: 'pin == 7319 and level >= 3 and not locked_out' },
      {
        id: 'd',
        code: 'pin == 7319 and level >= 3 or locked_out',
        whyNot:
          'This grants access to any locked-out account, the exact opposite of the rule. It needs `not locked_out`.',
      },
    ],
    correctOptionId: 'c',
    explanation: {
      evaluation:
        '`7319 == 7319` is `True`, `3 >= 3` is `True`, and `not False` is `True`. `True and True and True` is `True`, so core access is granted.',
      concept:
        'Translate each part of the rule into its own condition, then join them. "But never if X" becomes `and not X`.',
    },
  },
]
