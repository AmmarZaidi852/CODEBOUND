import type { CodeChallenge } from '../challenges/code.ts'
import type { GameModule } from '../challenges/interaction.ts'
import type { ChallengeSource } from '../progression/progress.ts'
import { gameModules } from './gameChallenges.ts'

/*
 * The Arcade Run: one fixed, curated order of challenges from every game,
 * plus two Arcade-only write modules. It teaches nothing new; it asks the
 * player to recognise taught ideas in a new context.
 * Challenges are referenced by id, never copied, so each one has a single
 * definition and its progress is shared with the game it belongs to.
 */

/** Transfer: the Code Breaker idea (and / not, `>=`) in a new setting. */
export const deliveryGate: CodeChallenge = {
  kind: 'code',
  id: 'delivery-gate',
  concepts: ['operators', 'conditions', 'data-types'],
  title: 'Delivery Gate',
  concept: 'Two conditions at once',
  lesson:
    '`and` needs both sides to be `True`. `not` flips a `True` / `False` value. "At least 5" includes 5 itself.',
  mission:
    'A delivery is accepted only when there are at least 5 `packages` and the dock is not `locked`. Print `ACCEPTED` or `REJECTED`.',
  goal: '`packages = 6`, `locked = False` prints `ACCEPTED`. Works for any delivery.',
  showGiven: true,
  starter: [
    'if packages > 5:',
    '    print("ACCEPTED")',
    'else:',
    '    print("REJECTED")',
  ],
  tests: [
    { given: { packages: '6', locked: 'False' }, output: ['ACCEPTED'] },
    { given: { packages: '5', locked: 'False' }, output: ['ACCEPTED'] },
    { given: { packages: '9', locked: 'True' }, output: ['REJECTED'] },
    { given: { packages: '4', locked: 'False' }, output: ['REJECTED'] },
    { given: { packages: '5', locked: 'True' }, output: ['REJECTED'] },
    { given: { packages: '2', locked: 'True' }, output: ['REJECTED'] },
  ],
  mistakes: [
    {
      when: (f) => f.tokens.includes('or') && f.output[0] === 'ACCEPTED',
      message:
        'A delivery that breaks one rule is still accepted. `or` accepts when either side is `True`; here both rules must hold, so use `and`.',
    },
    {
      when: (f) =>
        f.test.given?.locked === 'True' && f.output[0] === 'ACCEPTED',
      message:
        'The dock is locked, but the delivery is still accepted. The condition never checks `locked`: add it with `and`.',
    },
    {
      when: (f) =>
        f.test.given?.packages === '5' &&
        f.test.given.locked === 'False' &&
        f.output[0] === 'REJECTED',
      message:
        '5 packages is "at least 5", but it is rejected. `>` leaves 5 out.',
    },
  ],
  hints: [
    'Two rules must both be true: enough packages, and a dock that is not locked.',
    '`>=` includes the number itself. `and` joins two conditions; `not` flips `True` / `False`.',
    'Shape: `if packages __ 5 and ___ locked:`. The rest of the program stays.',
  ],
  solution: [
    'if packages >= 5 and not locked:',
    '    print("ACCEPTED")',
    'else:',
    '    print("REJECTED")',
  ],
  explanation: {
    steps:
      'For `packages = 5`, `locked = False`: `5 >= 5` is `True` and `not False` is `True`, so `True and True` accepts it. A locked dock makes `not locked` `False`, so it is rejected.',
    concept:
      'Turn each rule into one comparison, then join them: `and` when every rule must hold.',
  },
}

/** Final test: a function, a loop, a condition and arithmetic together. */
export const shieldBreach: CodeChallenge = {
  kind: 'code',
  id: 'shield-breach',
  tier: 'advanced',
  concepts: ['functions', 'lists', 'loops', 'conditions', 'operators'],
  title: 'Shield Breach',
  concept: 'Reading a whole function',
  lesson:
    'A variable set inside a loop starts again on every pass. `return` sends a value back to the caller; `print` only shows it.',
  mission:
    'A shield blocks `shield` damage from every hit. A hit that is not bigger than the shield does nothing; a bigger hit only gets through by the part above the shield. Repair `damage` so it returns the total damage that gets through.',
  goal: '`damage([5, 2, 8], 3)` returns `7`. Works for any hits and shield.',
  starter: [
    'def damage(hits, shield):',
    '    for hit in hits:',
    '        total = 0',
    '        if hit > shield:',
    '            total = total + hit',
    '    print(total)',
  ],
  tests: [
    {
      calls: [
        { fn: 'damage', args: ['[5, 2, 8]', '3'], returns: '7' },
        { fn: 'damage', args: ['[1, 2]', '3'], returns: '0' },
        { fn: 'damage', args: ['[]', '3'], returns: '0' },
        { fn: 'damage', args: ['[10]', '4'], returns: '6' },
        { fn: 'damage', args: ['[4, 4, 9]', '4'], returns: '5' },
        { fn: 'damage', args: ['[6, 7]', '0'], returns: '13' },
      ],
    },
  ],
  requirements: [
    {
      uses: 'for',
      message: 'Add the damage up with a `for` loop, so it works for any hits.',
    },
  ],
  mistakes: [
    {
      when: (f) => /returned `None`/.test(f.callMessage ?? ''),
      message:
        'The function shows the total with `print`, but sends nothing back, so the call gets `None`. Use `return` after the loop.',
    },
    {
      when: (f) => f.error?.kind === 'NameError' && /total/.test(f.source),
      message:
        '`total` only exists once the loop has run. Start it at 0 before the loop, so it exists even when there are no hits.',
    },
    {
      when: (f) =>
        /`damage\(\[5, 2, 8\], 3\)` returned `(5|8)`/.test(f.callMessage ?? ''),
      message:
        'The total only holds the last hit. `total = 0` is inside the loop, so it starts again on every pass: move it above the loop.',
    },
    {
      when: (f) =>
        /`damage\(\[5, 2, 8\], 3\)` returned `13`/.test(f.callMessage ?? ''),
      message:
        'Every big hit counts in full (5 + 8). Only the part above the shield gets through: subtract the shield from each hit.',
    },
    {
      when: (f) =>
        /`damage\(\[5, 2, 8\], 3\)` returned `2`/.test(f.callMessage ?? ''),
      message:
        'The function returns during the first pass of the loop. Move `return` after the loop (less indented).',
    },
  ],
  hints: [
    'Three things are off: where the total starts, what each hit adds, and how the answer leaves the function.',
    'A variable set inside the loop starts again on every pass. `hit - shield` is the part that gets through. `return` sends a value back; `print` only shows it.',
    'Shape: start the total before the loop, add the part above the shield inside the `if`, and send the total back after the loop.',
  ],
  solution: [
    'def damage(hits, shield):',
    '    total = 0',
    '    for hit in hits:',
    '        if hit > shield:',
    '            total = total + hit - shield',
    '    return total',
  ],
  explanation: {
    steps:
      'For `[5, 2, 8]` with shield 3: 5 lets 2 through, 2 is blocked, 8 lets 5 through, so `total` goes 0 → 2 → 2 → 7, and `return total` sends back 7 after the loop.',
    concept:
      'Start totals before the loop, change them inside it, and return them after it.',
  },
}

/** Challenges that exist only in the Arcade. */
export const arcadeChallenges: CodeChallenge[] = [deliveryGate, shieldBreach]

export interface ArcadeRef {
  source: ChallengeSource
  id: string
}

/**
 * The run, in play order: core ideas first (one per area), then two
 * advanced combinations, then the Final Run. Every interaction appears.
 */
export const arcadeRefs: readonly ArcadeRef[] = [
  { source: 'bug-hunt', id: 'arithmetic' }, // choose · variables + operators
  { source: 'arcade', id: 'delivery-gate' }, // write · conditions
  { source: 'data-sorter', id: 'pop' }, // choose · lists + indexing
  { source: 'data-sorter', id: 'for-loop' }, // build · loops
  { source: 'function-forge', id: 'predict' }, // predict · functions
  { source: 'function-forge', id: 'score-total' }, // write · functions + loops
  { source: 'code-breaker', id: 'override-switch' }, // predict · and / or / not
  { source: 'arcade', id: 'shield-breach' }, // write · final, 5 concepts
]

export interface ArcadeModule extends ArcadeRef {
  module: GameModule
}

/** Finds a referenced challenge's one definition. */
export function resolveArcadeRef(ref: ArcadeRef): GameModule {
  const list: readonly GameModule[] =
    ref.source === 'arcade' ? arcadeChallenges : gameModules[ref.source]
  const module = list.find((m) => m.id === ref.id)
  if (!module) throw new Error(`Unknown arcade module ${ref.source}:${ref.id}`)
  return module
}

export const arcadeModules: readonly ArcadeModule[] = arcadeRefs.map((ref) => ({
  ...ref,
  module: resolveArcadeRef(ref),
}))

/** The last module is the Final Run. */
export const ARCADE_FINAL = arcadeModules.length - 1
