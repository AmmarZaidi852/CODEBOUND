import { createContext, useContext } from 'react'
import type { ConceptId } from '../challenges/foundations.ts'
import type { GameId } from '../content/games.ts'
import type { ArcadeAnswer } from './arcade.ts'
import type {
  AnswerOutcome,
  ArcadeRun,
  ChallengeSource,
  Progress,
} from './progress.ts'

export interface ProgressApi {
  progress: Progress
  /** `hinted`: a hint was used, so a correct first try is not mastered. */
  answer: (
    source: ChallengeSource,
    challengeId: string,
    correct: boolean,
    hinted?: boolean,
  ) => AnswerOutcome
  completeConcept: (id: ConceptId) => void
  finishRun: (game: GameId, run: { fullRun: boolean; correct: number }) => void
  /** Starts a new Arcade Run at module 01. */
  startArcade: () => void
  /**
   * Records an answer to the Arcade module the run is on. `finished` is
   * the run's final stats when this answer completed it.
   */
  answerArcade: (
    ref: { source: ChallengeSource; id: string },
    total: number,
    answer: ArcadeAnswer,
  ) => { outcome: AnswerOutcome; finished: ArcadeRun | null }
  /** Moves past an Arcade module left unsolved. Safe to call on every Next. */
  leaveArcadeModule: (index: number, total: number) => ArcadeRun | null
  /** Erases saved progress and starts a fresh player. */
  reset: () => void
}

export const ProgressContext = createContext<ProgressApi | null>(null)

/** The player's progress and the only ways to change it. */
export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext)
  if (!api) throw new Error('useProgress must be used inside ProgressProvider')
  return api
}
