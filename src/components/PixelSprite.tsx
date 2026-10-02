import { useMemo } from 'react'
import { gridToPaths } from '../art/pixel.ts'
import { sprites, type SpriteId } from '../art/sprites.ts'
import './PixelSprite.css'

interface PixelSpriteProps {
  id: SpriteId
  /** Accessible description. Omit for decorative art. */
  label?: string
  className?: string
}

/** Renders one of CODEBOUND's pixel-art sprites as a crisp, scalable SVG. */
function PixelSprite({ id, label, className = '' }: PixelSpriteProps) {
  const { grid, cursor } = sprites[id]
  const paths = useMemo(() => gridToPaths(grid), [grid])

  return (
    <svg
      className={`pixel-sprite ${className}`}
      viewBox={`0 0 ${grid[0].length} ${grid.length}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {paths.map(({ color, d }) => (
        <path key={color} d={d} style={{ fill: color }} />
      ))}
      {cursor && (
        <rect
          className="pixel-sprite__cursor"
          x={cursor.x}
          y={cursor.y}
          width={1}
          height={1}
        />
      )}
    </svg>
  )
}

export default PixelSprite
