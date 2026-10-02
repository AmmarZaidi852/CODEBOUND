import { useEffect, useRef, useState } from 'react'
import { xpForResult } from './xp.ts'

export interface RunResult {
  correct: boolean
  xpEarned: number
}

/**
 * State for one play-through of a sequence of challenges:
 * pick an answer → submit once → feedback → next → ... → finished.
 * Games decide whether an answer is correct; this hook handles the rest.
 */
export function useChallengeRun(
  total: number,
  onEarnXp: (amount: number) => void,
) {
  const [index, setIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [runXp, setRunXp] = useState(0)
  const [solved, setSolved] = useState(0)
  const [finished, setFinished] = useState(false)

  const titleRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLHeadingElement>(null)

  // Move focus (and the viewport) to the new content after each step.
  useEffect(() => {
    if (index > 0) titleRef.current?.focus()
  }, [index])
  useEffect(() => {
    if (result) feedbackRef.current?.focus()
  }, [result])

  const isLast = index === total - 1

  function select(id: string) {
    if (!result) setSelectedId(id)
  }

  /**
   * Records the answer once; later calls for the same challenge are ignored.
   * Screens only enable submitting once the player has an answer.
   */
  function submit(correct: boolean) {
    if (result) return
    const xpEarned = xpForResult(correct)
    setResult({ correct, xpEarned })
    setRunXp((sum) => sum + xpEarned)
    if (correct) setSolved((count) => count + 1)
    onEarnXp(xpEarned)
  }

  function next() {
    if (!result) return
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setSelectedId(null)
    setResult(null)
  }

  return {
    index,
    isLast,
    selectedId,
    result,
    runXp,
    solved,
    finished,
    titleRef,
    feedbackRef,
    select,
    submit,
    next,
  }
}
