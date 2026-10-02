/**
 * Tiny pixel-art toolkit. A sprite is a list of equal-length rows; each
 * character is one pixel and maps to a colour token ('.' is transparent).
 * Sprites are composed from small parts so rows stay easy to read and edit.
 */

export type Grid = readonly string[]

/** Sprite pixel → CSS colour. 't' / 'T' follow the current area's tone. */
export const pixelColors: Record<string, string> = {
  k: 'var(--px-outline)',
  d: 'var(--px-dark)',
  m: 'var(--px-mid)',
  l: 'var(--px-light)',
  h: 'var(--px-shine)',
  w: 'var(--px-white)',
  s: 'var(--px-screen)',
  g: 'var(--green)',
  G: 'var(--green-dim)',
  c: 'var(--cyan)',
  C: 'var(--cyan-dim)',
  a: 'var(--amber)',
  A: 'var(--amber-dim)',
  p: 'var(--magenta)',
  P: 'var(--magenta-dim)',
  v: 'var(--violet)',
  V: 'var(--violet-dim)',
  r: 'var(--red)',
  t: 'var(--tone)',
  T: 'var(--tone-dim)',
}

/** `ch` repeated `n` times — keeps long rows countable. */
export const rep = (ch: string, n: number) => ch.repeat(n)

/** Draws parts onto a blank `width` × `height` canvas. '.' never overwrites. */
export function compose(
  width: number,
  height: number,
  parts: readonly (readonly [x: number, y: number, grid: Grid])[],
): Grid {
  const canvas = Array.from({ length: height }, () => Array(width).fill('.'))
  for (const [x, y, grid] of parts) {
    grid.forEach((row, dy) => {
      ;[...row].forEach((ch, dx) => {
        const px = x + dx
        const py = y + dy
        if (ch !== '.' && px < width && py < height) canvas[py][px] = ch
      })
    })
  }
  return canvas.map((row) => row.join(''))
}

/**
 * One SVG path per colour, with horizontal runs merged into single rects,
 * so even the largest sprite renders as a handful of DOM nodes.
 */
export function gridToPaths(grid: Grid): { color: string; d: string }[] {
  const paths = new Map<string, string>()
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      if (ch !== '.') {
        const run = end - x
        paths.set(ch, `${paths.get(ch) ?? ''}M${x} ${y}h${run}v1h-${run}z`)
      }
      x = end
    }
  })
  return [...paths].map(([ch, d]) => ({ color: pixelColors[ch], d }))
}
