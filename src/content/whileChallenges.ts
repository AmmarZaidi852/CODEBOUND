import type { CodeChallenge } from '../challenges/code.ts'
import type { CodeBreakerChallenge } from '../challenges/codeBreaker.ts'

/*
 * Code Breaker's `while` modules (Foundations concept 9). A `while` loop
 * is a condition that keeps a block running, so each one combines it with
 * a comparison and a variable the loop changes. They sit after the game's
 * other ADVANCED modules (never in CORE, so Core completion and the Arcade
 * unlock of a saved game stay as they were).
 */

export const countdownLock: CodeBreakerChallenge = {
  id: 'countdown-lock',
  tier: 'advanced',
  concepts: ['while', 'operators', 'variables'],
  system: 'Countdown Lock',
  concept: 'Tracing a while loop',
  lesson:
    'A `while` loop checks its condition, runs the body, then checks again. It stops the first time the condition is `False`, and the line after the loop runs once.',
  rule: 'The lock counts down from 9 in steps of 3 and opens once the timer is no longer above 0.',
  state: [{ name: 'timer', value: '9' }],
  code: [
    'timer = 9',
    '',
    'while timer > 0:',
    '    print(timer)',
    '    timer = timer - 3',
    '',
    'print("OPEN")',
  ],
  prompt: 'What does the lock print?',
  options: [
    { id: 'a', code: '9, 6, 3, OPEN' },
    {
      id: 'b',
      code: '9, 6, 3, 0, OPEN',
      whyNot:
        'After printing 3, `timer` becomes 0. The condition is checked again before the next print: `0 > 0` is `False`, so 0 is never printed.',
    },
    {
      id: 'c',
      code: '6, 3, 0, OPEN',
      whyNot:
        'The body prints before it subtracts, so the first value printed is 9, and the loop stops before 0.',
    },
    {
      id: 'd',
      code: '9, OPEN, 6, OPEN, 3, OPEN',
      whyNot:
        '`print("OPEN")` is not indented, so it is not part of the loop. It runs once, after the loop ends.',
    },
  ],
  correctOptionId: 'a',
  explanation: {
    evaluation:
      '`timer` is 9, 6, then 3 when `timer > 0` is checked, and each pass prints it before taking 3 away. At 0, `0 > 0` is `False`: the loop ends and OPEN prints once.',
    concept:
      'Check, run, check again: a `while` loop stops at the first `False`, and only the indented lines repeat.',
  },
}

export const retryLimit: CodeBreakerChallenge = {
  id: 'retry-limit',
  tier: 'advanced',
  concepts: ['while', 'operators'],
  system: 'Retry Limit',
  concept: 'The condition that keeps a loop going',
  lesson:
    'A `while` condition says when to keep going, not when to stop. Count the passes: a counter that starts at 0 and must stop after 3 passes keeps going while it is below 3.',
  rule: 'The keypad allows exactly 3 wrong tries, then prints LOCKED OUT.',
  state: [{ name: 'tries', value: '0' }],
  code: [
    'tries = 0',
    '',
    'while ____:',
    '    print("WRONG CODE")',
    '    tries = tries + 1',
    '',
    'print("LOCKED OUT")',
  ],
  prompt: 'Which condition allows exactly 3 tries?',
  options: [
    { id: 'a', code: 'tries < 3' },
    {
      id: 'b',
      code: 'tries <= 3',
      whyNot:
        '`tries` is checked at 0, 1, 2 and 3, and `3 <= 3` is still `True`: the keypad allows 4 tries, one too many.',
    },
    {
      id: 'c',
      code: 'tries == 3',
      whyNot:
        'That describes when to stop, not when to keep going. `tries` starts at 0, `0 == 3` is `False`, so the loop never runs at all.',
    },
    {
      id: 'd',
      code: 'tries > 3',
      whyNot:
        '`tries` starts at 0, and `0 > 3` is `False`, so the keypad locks out before a single try.',
    },
  ],
  correctOptionId: 'a',
  explanation: {
    evaluation:
      '`tries` is 0, 1 and 2 when `tries < 3` is checked: three passes, three WRONG CODE lines. At 3, `3 < 3` is `False` and LOCKED OUT prints.',
    concept:
      'Write the condition for continuing. A counter from 0 with `< n` runs exactly n times.',
  },
}

export const stuckLoop: CodeChallenge = {
  kind: 'code',
  id: 'stuck-loop',
  tier: 'advanced',
  concepts: ['while', 'operators', 'variables'],
  title: 'Stuck Loop',
  concept: 'A loop must change its condition',
  lesson:
    'A `while` loop only ends when its condition becomes `False`. If nothing inside the loop changes the variable it checks, the loop runs forever.',
  mission:
    'The cooling fan should print each `heat` reading and cool the system by 10 each pass, while `heat` is 50 or more. Then it prints `COOL`. Right now it never stops. Fix the loop.',
  goal: '`heat = 80` prints `80`, `70`, `60`, `50`, then `COOL`. Works for any heat.',
  showGiven: true,
  starter: ['while heat >= 50:', '    print(heat)', 'print("COOL")'],
  tests: [
    { given: { heat: '80' }, output: ['80', '70', '60', '50', 'COOL'] },
    { given: { heat: '50' }, output: ['50', 'COOL'] },
    { given: { heat: '65' }, output: ['65', '55', 'COOL'] },
    { given: { heat: '45' }, output: ['COOL'] },
  ],
  requirements: [
    {
      uses: 'while',
      message:
        'Keep the `while` loop: the fan has to keep cooling for any starting heat.',
    },
  ],
  mistakes: [
    {
      when: (f) => f.error?.kind === 'Timeout',
      message:
        'The loop never ends: nothing inside it changes `heat`, so the condition stays `True`. Lower `heat` by 10 on every pass, inside the loop.',
    },
    {
      when: (f) => f.test.given?.heat === '80' && f.output[0] === '70',
      message:
        'The first reading, 80, is missing: `heat` is lowered before it is printed. Print the reading first, then cool it.',
    },
    {
      when: (f) => f.test.given?.heat === '80' && f.output[1] === '79',
      message:
        'The fan cools by 10 each pass, not 1. Take 10 away from `heat`.',
    },
    {
      when: (f) => f.test.given?.heat === '80' && f.output.includes('40'),
      message:
        'The fan printed 40, which is below 50. Make sure the reading is printed before `heat` changes, and keep the condition `heat >= 50`.',
    },
    {
      when: (f) =>
        (f.test.given?.heat === '80' &&
          f.output.join(' ') === '80 70 60 COOL') ||
        (f.test.given?.heat === '50' && f.output[0] === 'COOL'),
      message:
        'At exactly 50 the fan should still run once. "50 or more" includes 50, so keep `>=`.',
    },
  ],
  hints: [
    'The condition can only become `False` if something inside the loop changes `heat`.',
    'Each pass should take 10 away from `heat`, after the reading is printed, at the same indent as `print(heat)`.',
    'Shape: one new line inside the loop that stores `heat` minus 10 back in `heat`.',
  ],
  solution: [
    'while heat >= 50:',
    '    print(heat)',
    '    heat = heat - 10',
    'print("COOL")',
  ],
  explanation: {
    steps:
      '`heat` starts at 80. Each pass prints it and takes 10 away: 80, 70, 60, 50. Then `heat` is 40, `40 >= 50` is `False`, and COOL prints.',
    concept:
      'Every `while` loop needs a line inside it that moves the condition towards `False`.',
  },
}

/** Every module in this file, for tests. */
export const whileModules = [countdownLock, retryLimit, stuckLoop]
