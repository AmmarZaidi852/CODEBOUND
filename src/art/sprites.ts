import { compose, rep, type Grid } from './pixel.ts'

/*
 * Original CODEBOUND pixel art. Each area has one sprite; game sprites use
 * the tone pixels ('t' / 'T') so they pick up their area colour.
 * Palette keys are listed in pixel.ts.
 */

export type SpriteId =
  | 'hero'
  | 'foundations'
  | 'bug-hunt'
  | 'code-breaker'
  | 'data-sorter'
  | 'function-forge'

export interface Sprite {
  grid: Grid
  /** Pixel position of an animated terminal cursor, if the sprite has a screen. */
  cursor?: { x: number; y: number }
}

// ── Shared parts ─────────────────────────────────────────────────────────

/** A CRT monitor: outline, bezel, and a screen of `screen` rows. */
function monitor(screen: Grid, ledRow: string): Grid {
  const w = screen[0].length + 6
  return [
    rep('k', w),
    'k' + rep('m', w - 2) + 'k',
    'km' + rep('k', w - 4) + 'mk',
    ...screen.map((row) => 'kmk' + row + 'kmk'),
    'km' + rep('k', w - 4) + 'mk',
    ledRow,
    rep('k', w),
  ]
}

const cog: Grid = [
  '...h...',
  '.hhhhh.',
  '.hh.hh.',
  'hh...hh',
  '.hh.hh.',
  '.hhhhh.',
  '...h...',
]

const blank = (w: number) => rep('s', w)

// ── Home: a retro terminal with a code cartridge plugged in ──────────────

const heroScreen: Grid = [
  blank(26),
  's' + 'g' + 's' + rep('c', 5) + 's' + rep('g', 8) + rep('s', 9),
  blank(26),
  'sss' + rep('a', 4) + 's' + rep('g', 11) + rep('s', 7),
  blank(26),
  'sss' + rep('p', 4) + 's' + rep('g', 3) + 's' + rep('c', 6) + rep('s', 8),
  blank(26),
  's' + 'g' + 's' + rep('g', 14) + rep('s', 9),
  blank(26),
  's' + 'g' + rep('s', 24),
  blank(26),
  blank(26),
  's' + rep('g', 12) + rep('G', 12) + 's',
  blank(26),
  blank(26),
]

const heroCartridge: Grid = [
  'kkkkkkk',
  'kgggggk',
  'kgwwwgk',
  'kgkkkgk',
  'kgwwwgk',
  'kgggggk',
  'kGGGGGk',
  'kgggggk',
  'kakakak',
  'kkkkkkk',
]

const heroTracesLeft: Grid = [
  '..w.....',
  '..c.....',
  '..cccccc',
  '..c.....',
  '..c.....',
  'wcc.....',
  '..c.....',
  '..c.....',
  '..c..ccc',
  '..c..c..',
  '..cccc..',
  '..c.....',
  '..c.....',
  '..c.....',
  '..w.....',
]

const heroTracesRight: Grid = [
  '....w...',
  '....p...',
  'ppppp...',
  '........',
  '........',
  'pppppppw',
  '........',
  'ppp.....',
  '..p.....',
  '..w.....',
]

const keyboard: Grid = [
  rep('k', 40),
  'k' + rep('llk', 12) + 'll' + 'k',
  'kk' + rep('llk', 12) + 'l' + 'k',
  'k' + rep('llk', 3) + rep('l', 20) + 'k' + rep('llk', 2) + 'll' + 'k',
  rep('k', 40),
]

const hero: Sprite = {
  grid: compose(48, 32, [
    [0, 3, heroTracesLeft],
    [40, 3, heroTracesRight],
    [8, 0, monitor(heroScreen, 'k' + 'mm' + 'g' + rep('m', 24) + 'lll' + 'k')],
    [20, 21, ['kmmmmmmk', 'kmmmmmmk']],
    [16, 23, [rep('k', 16), 'k' + rep('l', 14) + 'k', rep('k', 16)]],
    [4, 26, keyboard],
    [41, 16, heroCartridge],
  ]),
  // Screen row 9, just after the prompt: monitor (8, 0) + bezel (3, 3).
  cursor: { x: 14, y: 12 },
}

// ── Foundations: a training cartridge and its manual ─────────────────────

const cartLabel: Grid = [
  rep('t', 10),
  't' + 'k' + rep('t', 8),
  'tt' + 'k' + rep('t', 7),
  't' + 'k' + 'tt' + 'kkk' + rep('t', 3),
  rep('t', 10),
  rep('T', 10),
  't' + rep('k', 6) + 'ttt',
  rep('t', 10),
]

const trainingCartridge: Grid = [
  rep('k', 16) + '..',
  'k' + rep('m', 15) + 'k.',
  'k' + rep('m', 16) + 'k',
  'kmm' + rep('k', 12) + 'mmk',
  ...cartLabel.map((row) => 'kmmk' + row + 'kmmk'),
  'kmm' + rep('k', 12) + 'mmk',
  'k' + rep('m', 16) + 'k',
  'km' + rep('dm', 7) + 'mk',
  'k' + rep('m', 16) + 'k',
  'km' + rep('ak', 7) + 'mk',
  rep('k', 18),
]

const manual: Grid = [
  rep('k', 9),
  'k' + rep('c', 7) + 'k',
  'kc' + rep('w', 5) + 'ck',
  'kc' + rep('w', 5) + 'ck',
  'k' + rep('c', 7) + 'k',
  'k' + rep('c', 7) + 'k',
  'kc' + 'www' + rep('c', 3) + 'k',
  'k' + rep('c', 7) + 'k',
  'k' + rep('C', 7) + 'k',
  'k' + rep('w', 7) + 'k',
  rep('k', 9),
]

const sparkle: Grid = ['.a.', 'aaa', '.a.']

const foundations: Sprite = {
  grid: compose(32, 24, [
    [3, 2, trainingCartridge],
    [22, 9, manual],
    [25, 3, sparkle],
    [29, 6, ['a']],
  ]),
}

// ── Bug Hunt: a corrupted terminal with a glitch bug crawling off it ─────

const bugScreen: Grid = [
  blank(18),
  's' + rep('g', 4) + 's' + rep('a', 6) + rep('s', 6),
  blank(18),
  'ss' + 'gg' + 's' + rep('g', 8) + rep('s', 5),
  blank(18),
  's' + 'rrr' + 'w' + 'rrr' + 's' + rep('r', 6) + 'sss',
  blank(18),
  's' + 'gg' + 's' + rep('a', 6) + 's' + rep('g', 4) + 'sss',
  blank(18),
  's' + 'g' + 's' + 'w' + rep('s', 14),
  blank(18),
  blank(18),
]

const bug: Grid = [
  'T.....T',
  '.T...T.',
  '..ttt..',
  '.twtwt.',
  '..ttt..',
  'TTtTtTT',
  '.ttTtt.',
  'TTtTtTT',
  '.ttTtt.',
  'TTtTtTT',
  '..ttt..',
]

const bugHunt: Sprite = {
  grid: compose(32, 24, [
    [1, 1, monitor(bugScreen, 'k' + rep('m', 19) + 'r' + 'mm' + 'k')],
    [9, 19, ['kmmmmmmk']],
    [7, 20, [rep('k', 12)]],
    [24, 7, bug],
    [27, 4, ['r', '.', '.r']],
    [21, 2, ['a.', '..', '.a']],
  ]),
}

// ── Code Breaker: a security padlock and a digital key ───────────────────

const padlock: Grid = [
  '....kkkkkkkk....',
  '...kllllllllk...',
  '..klh' + rep('k', 6) + 'hlk..',
  '..klk......klk..',
  '..klk......klk..',
  '..klk......klk..',
  '..klk......klk..',
  rep('k', 16),
  'k' + rep('t', 14) + 'k',
  'ktw' + rep('t', 12) + 'k',
  'k' + rep('t', 12) + 'TTk',
  'k' + rep('t', 5) + 'kkkk' + 'tttTTk',
  'k' + rep('t', 5) + 'kkkk' + 'tttTTk',
  'k' + rep('t', 6) + 'kk' + 'ttttTk',
  'k' + rep('t', 6) + 'kk' + 'ttttTk',
  'k' + rep('t', 11) + 'TTTk',
  'k' + rep('T', 14) + 'k',
  rep('k', 16),
]

const key: Grid = ['.....ccc', 'cccccc.c', '.c.c.ccc']

const bits: Grid = [
  '..c.....',
  '........',
  '.c..c...',
  '........',
  '....c...',
  '........',
  '..cc....',
  '........',
  'c.......',
  '........',
  '...c....',
  '........',
  '.c..c...',
  '........',
  '..c.....',
]

const codeBreaker: Sprite = {
  grid: compose(32, 24, [
    [0, 4, bits],
    [
      25,
      5,
      ['..c..c', '', '.c....', '', '', '....c.', '', '', '', '', '...c..'],
    ],
    [8, 3, padlock],
    [24, 14, key],
  ]),
}

// ── Data Sorter: data crates being sorted onto an indexed shelf ──────────

/** A 5-wide data crate `h` pixels tall. */
function crate(h: number): Grid {
  const middle = Array.from({ length: h - 3 }, (_, i) =>
    i % 3 === 2 ? 'kTTTk' : 'ktttk',
  )
  return ['kkkkk', 'kwttk', ...middle, 'kkkkk']
}

const slot: Grid = [
  'm.m.m',
  '.....',
  'm...m',
  '.....',
  'm...m',
  '.....',
  'm...m',
  '.....',
  'm.m.m',
]

const dataSorter: Sprite = {
  grid: compose(32, 24, [
    [1, 17, crate(3)],
    [7, 15, crate(5)],
    [13, 13, crate(7)],
    [19, 11, slot],
    [25, 9, crate(11)],
    [19, 0, crate(9)],
    [19, 9, ['.aaa.', '..a..']],
    [0, 20, [rep('l', 32), rep('m', 32)]],
    [3, 22, ['g.....g.....g.....g.....g']],
  ]),
}

// ── Function Forge: input → machine → output ─────────────────────────────

const machine: Grid = [
  rep('k', 14),
  'k' + rep('t', 12) + 'k',
  'k' + rep('T', 12) + 'k',
  'k' + rep('m', 12) + 'k',
  'kmk' + rep('k', 8) + 'kmk',
  'kmk' + 'ssssssss' + 'kmk',
  'kmk' + 'sgssgsss' + 'kmk',
  'kmk' + 'ssgssgss' + 'kmk',
  'kmk' + 'sgssgsss' + 'kmk',
  'kmk' + 'ssssssss' + 'kmk',
  'kmk' + rep('k', 8) + 'kmk',
  'km' + 'a' + 'm' + 'g' + rep('m', 8) + 'k',
  'k' + rep('m', 12) + 'k',
  rep('k', 14),
]

const pipe: Grid = [rep('k', 9), rep('l', 9), rep('m', 9), rep('k', 9)]

const forgeFunction: Sprite = {
  grid: compose(32, 24, [
    [9, 0, cog],
    [16, 1, cog],
    [9, 5, machine],
    [0, 12, pipe],
    [23, 12, pipe],
    [2, 9, ['waa', 'aaa', 'aaa']],
    [27, 9, ['wgg', 'ggg', 'ggg']],
    [11, 19, ['kk', 'kk']],
    [20, 19, ['kk', 'kk']],
    [7, 21, [rep('m', 18)]],
  ]),
}

export const sprites: Record<SpriteId, Sprite> = {
  hero,
  foundations,
  'bug-hunt': bugHunt,
  'code-breaker': codeBreaker,
  'data-sorter': dataSorter,
  'function-forge': forgeFunction,
}
