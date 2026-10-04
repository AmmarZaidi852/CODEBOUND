import { useEffect, useRef, useState } from 'react'
import type { ChallengeSource } from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'
import type { RunResult } from './useChallengeRun.ts'

/**
 * One Mastery Lab practice: a single module, answered and recorded through
 * the same answer() its game uses, so XP, mastery and replays follow the
 * normal rules and the game sees the result.
 */
export function useLabPractice(ref: { source: ChallengeSource; id: string }) {
  const { answer } = useProgress()
  const [result, setResult] = useState<RunResult | null>(null)
  /** XP this practice paid (a retry after a miss can add its top-up). */
  const [xp, setXp] = useState(0)
  const [finished, setFinished] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (result) feedbackRef.current?.focus()
  }, [result])

  function submit(correct: boolean, hinted = false) {
    if (result || finished) return
    const outcome = answer(ref.source, ref.id, correct, hinted)
    setResult({ correct, ...outcome })
    setXp((n) => n + outcome.xpEarned)
  }

  /** After a wrong write-module check, lets the player check again. */
  function retry() {
    if (result && !result.correct) setResult(null)
  }

  function next() {
    if (result) setFinished(true)
  }

  return {
    result,
    xp,
    finished,
    titleRef,
    feedbackRef,
    submit,
    retry,
    next,
  }
}
