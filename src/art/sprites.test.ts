import { describe, expect, it } from 'vitest'
import { compose, gridToPaths, pixelColors } from './pixel.ts'
import { sprites } from './sprites.ts'

describe('pixel art', () => {
  it('composes parts without overwriting with transparent pixels', () => {
    expect(
      compose(4, 2, [
        [0, 0, ['kk', 'kk']],
        [1, 0, ['.w']],
      ]),
    ).toEqual(['kkw.', 'kk..'])
  })

  it('merges horizontal runs into one path per colour', () => {
    expect(gridToPaths(['kk.w'])).toEqual([
      { color: pixelColors.k, d: 'M0 0h2v1h-2z' },
      { color: pixelColors.w, d: 'M3 0h1v1h-1z' },
    ])
  })

  it.each(Object.entries(sprites))(
    '%s is a rectangular grid of known colours',
    (_, { grid, cursor }) => {
      const width = grid[0].length
      for (const row of grid) {
        expect(row).toHaveLength(width)
        for (const ch of row) {
          expect(ch === '.' || ch in pixelColors).toBe(true)
        }
      }
      if (cursor) {
        expect(cursor.x).toBeLessThan(width)
        expect(cursor.y).toBeLessThan(grid.length)
      }
    },
  )
})
