import type { RefObject } from 'react'
import type { SpriteId } from '../art/sprites.ts'
import type { RunResult } from '../game/useChallengeRun.ts'
import type { ChallengeState } from '../progression/progress.ts'

/** Replaces the HUD's art and name, e.g. inside an Arcade Run. */
export interface RoundHud {
  art: SpriteId
  name: string
}

/** What every round (one module of any game) gets from its runner. */
export interface RoundProps {
  index: number
  total: number
  /** Saved state of every module in the run, for the HUD. */
  states: readonly ChallengeState[]
  result: RunResult | null
  isLast: boolean
  /** `hinted`: a hint was opened before this answer (write modules). */
  onSubmit: (correct: boolean, hinted?: boolean) => void
  onNext: () => void
  titleRef: RefObject<HTMLHeadingElement | null>
  feedbackRef: RefObject<HTMLHeadingElement | null>
  hud?: RoundHud
}
