import { useEffect, useRef, useState } from 'react'
import type { GameId } from '../content/games.ts'
import {
  continueIndex,
  gameStates,
  gameStatus,
  type AnswerOutcome,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'

export interface RunResult extends AnswerOutcome {
  correct: boolean
}

/** Where a run begins: the first unfinished challenge, or module 01. */
export type RunStart = 'continue' | 'start'

/** What one play-through achieved, for the completion screen. */
export interface RunStats {
  /** Challenges answered in this run. */
  played: number
  /** Answered correctly in this run. */
  correct: number
  runXp: number
  /** The game was already complete before this run began. */
  replay: boolean
}

/**
 * State for one play-through of a game's challenges:
 * pick an answer → submit once → feedback → next → ... → finished.
 * Games decide whether an answer is correct; saved progress decides the
 * XP and mastery, and where Continue starts.
 */
export function useChallengeRun(
  game: GameId,
  challenges: readonly { id: string }[],
  startAt: RunStart = 'continue',
) {
  const { progress, answer, finishRun } = useProgress()
  const ids = challenges.map((c) => c.id)
  const states = gameStates(progress, game, ids)

  // Fixed when the run begins; later answers must not move them.
  const [start] = useState(() =>
    startAt === 'start' ? 0 : continueIndex(states),
  )
  const [replay] = useState(() => {
    const status = gameStatus(states)
    return status === 'complete' || status === 'mastered'
  })

  const [index, setIndex] = useState(start)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [runXp, setRunXp] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLHeadingElement>(null)

  // Move focus (and the viewport) to the new content after each step.
  useEffect(() => {
    if (index > start) titleRef.current?.focus()
  }, [index, start])
  useEffect(() => {
    if (result) feedbackRef.current?.focus()
  }, [result])

  const isLast = index === challenges.length - 1

  function select(id: string) {
    if (!result) setSelectedId(id)
  }

  /**
   * Records the answer once; later calls for the same challenge are ignored.
   * Screens only enable submitting once the player has an answer.
   */
  function submit(isCorrect: boolean) {
    if (result) return
    const outcome = answer(game, ids[index], isCorrect)
    setResult({ correct: isCorrect, ...outcome })
    setRunXp((sum) => sum + outcome.xpEarned)
    if (isCorrect) setCorrect((n) => n + 1)
  }

  function next() {
    if (!result) return
    if (isLast) {
      finishRun(game, { fullRun: start === 0, correct })
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setSelectedId(null)
    setResult(null)
  }

  const stats: RunStats = {
    played: index - start + 1,
    correct,
    runXp,
    replay,
  }

  return {
    index,
    isLast,
    selectedId,
    result,
    finished,
    /** Saved state of every challenge, for the HUD. */
    states,
    stats,
    titleRef,
    feedbackRef,
    select,
    submit,
    next,
  }
}
