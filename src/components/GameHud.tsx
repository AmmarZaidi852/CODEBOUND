import type { SpriteId } from '../art/sprites.ts'
import PixelProgress from './PixelProgress.tsx'
import PixelSprite from './PixelSprite.tsx'
import StatusBadge, { type StatusState } from './StatusBadge.tsx'
import './GameHud.css'

interface GameHudProps {
  art: SpriteId
  name: string
  index: number
  total: number
  /** Word for one step: "Module", "Lesson". */
  unit?: string
  status?: { label: string; value: string; state: StatusState }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Top strip of every challenge: area art, name, MODULE 02 / 05, and status. */
function GameHud({
  art,
  name,
  index,
  total,
  unit = 'Module',
  status,
}: GameHudProps) {
  return (
    <section className="game-hud panel" aria-label={`${name} status`}>
      <div className="game-hud__art">
        <PixelSprite id={art} />
      </div>
      <div className="game-hud__info">
        <p className="game-hud__name">{name}</p>
        <div className="game-hud__progress">
          <span className="game-hud__count">
            {unit} {pad(index + 1)} / {pad(total)}
          </span>
          <PixelProgress
            className="game-hud__bar"
            value={index}
            current={index}
            total={total}
            label={`${name} progress`}
            valueText={`${unit} ${index + 1} of ${total}`}
          />
        </div>
      </div>
      {status && <StatusBadge {...status} />}
    </section>
  )
}

export default GameHud
