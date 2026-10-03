import { createContext, useContext } from 'react'
import type { ConceptId } from '../challenges/foundations.ts'
import type { GameId } from '../content/games.ts'
import type { AnswerOutcome, Progress } from './progress.ts'

export interface ProgressApi {
  progress: Progress
  answer: (game: GameId, challengeId: string, correct: boolean) => AnswerOutcome
  completeConcept: (id: ConceptId) => void
  finishRun: (game: GameId, run: { fullRun: boolean; correct: number }) => void
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
