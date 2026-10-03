import { useRef, useState, type ReactNode } from 'react'
import {
  applyAnswer,
  applyConcept,
  applyRunEnd,
  newProgress,
  type Progress,
} from './progress.ts'
import { ProgressContext, type ProgressApi } from './ProgressContext.ts'
import { clearProgress, loadProgress, saveProgress } from './storage.ts'

interface ProgressProviderProps {
  children: ReactNode
  /** Starting progress (tests). Defaults to what is saved on this device. */
  initial?: Progress
}

/** Holds the one copy of player progress and saves every change. */
function ProgressProvider({ children, initial }: ProgressProviderProps) {
  // Restored before the first render, so nothing "animates in" on reload.
  const [progress, setProgress] = useState(() => initial ?? loadProgress())
  // Latest value for handlers that must return a result synchronously.
  const latest = useRef(progress)

  function commit(next: Progress) {
    latest.current = next
    setProgress(next)
    saveProgress(next)
  }

  const api: ProgressApi = {
    progress,
    answer(game, challengeId, correct) {
      const result = applyAnswer(latest.current, game, challengeId, correct)
      commit(result.progress)
      return result.outcome
    },
    completeConcept(id) {
      const result = applyConcept(latest.current, id)
      if (result.xpEarned > 0) commit(result.progress)
    },
    finishRun(game, run) {
      commit(applyRunEnd(latest.current, game, run))
    },
    reset() {
      clearProgress()
      const fresh = newProgress()
      latest.current = fresh
      setProgress(fresh)
    },
  }

  return <ProgressContext value={api}>{children}</ProgressContext>
}

export default ProgressProvider
