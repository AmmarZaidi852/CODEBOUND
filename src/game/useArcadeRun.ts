import { useEffect, useRef, useState } from 'react'
import { isCodeChallenge } from '../challenges/code.ts'
import { arcadeModules } from '../content/arcade.ts'
import {
  challengeKey,
  challengeState,
  type ArcadeBest,
  type ArcadeRun,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import type { RunResult } from './useChallengeRun.ts'

/**
 * One Arcade Run: answer → feedback → next, through the curated modules.
 * The run's position and counts are saved in progress after every answer,
 * so leaving or reloading continues at the right module. Each answer is
 * recorded under the challenge's own game, with the normal XP rules.
 */
export function useArcadeRun() {
  const { progress, answerArcade, leaveArcadeModule } = useProgress()
  const total = arcadeModules.length

  // Fixed when the screen opens: where to resume, and the best to beat.
  const [index, setIndex] = useState(() => progress.arcade.run?.at ?? 0)
  const [bestBefore] = useState<ArcadeBest | null>(progress.arcade.best)
  const [result, setResult] = useState<RunResult | null>(null)
  /** The completed run's stats, once the last module is settled. */
  const [final, setFinal] = useState<ArcadeRun | null>(null)
  const [finished, setFinished] = useState(false)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLHeadingElement>(null)
  const [start] = useState(index)

  useEffect(() => {
    if (index > start) titleRef.current?.focus()
  }, [index, start])
  useEffect(() => {
    if (result) feedbackRef.current?.focus()
  }, [result])

  const current = arcadeModules[index]
  const isLast = index === total - 1

  /** Saved state of every module in the run, for the HUD. */
  const states = arcadeModules.map((m) =>
    challengeState(progress.challenges[challengeKey(m.source, m.id)]),
  )

  function submit(correct: boolean, hinted = false) {
    if (result || finished) return
    const recorded = answerArcade(current, total, {
      correct,
      hinted,
      canRetry: isCodeChallenge(current.module),
    })
    setResult({ correct, ...recorded.outcome })
    if (recorded.finished) setFinal(recorded.finished)
  }

  /** After a wrong write-module check, lets the player check again. */
  function retry() {
    if (result && !result.correct) setResult(null)
  }

  function next() {
    if (!result) return
    // Moves past a module left unsolved; already-settled ones are ignored.
    const ended = leaveArcadeModule(index, total)
    if (ended) setFinal(ended)
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setResult(null)
  }

  return {
    index,
    total,
    current,
    isLast,
    result,
    states,
    finished,
    /** The finished run's stats (set once the run ends). */
    final,
    bestBefore,
    titleRef,
    feedbackRef,
    submit,
    retry,
    next,
  }
}
