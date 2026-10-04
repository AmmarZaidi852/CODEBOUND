import { useEffect, useRef, useState } from 'react'
import { tierOf, type Tier } from '../challenges/meta.ts'
import type { GameId } from '../content/games.ts'
import {
  bossState,
  continueIndex,
  gameStates,
  gameStatus,
  sectionOf,
  type AnswerOutcome,
  type ChallengeState,
} from '../progression/progress.ts'
import { useProgress } from '../progression/ProgressContext.ts'

export interface RunResult extends AnswerOutcome {
  correct: boolean
}

/**
 * Where a run begins: the first unfinished module (continue), module 01
 * (start), or the first module of a tier ('advanced', 'boss').
 */
export type RunStart = 'continue' | 'start' | 'advanced' | 'boss'

/** What one play-through achieved, for the completion screen. */
export interface RunStats {
  /** Challenges answered in this run. */
  played: number
  /** Answered correctly in this run. */
  correct: number
  runXp: number
  /** The game was already complete before this run began. */
  replay: boolean
  /** The tier this run played. A run covers one tier section. */
  section: Tier
}

function startIndex(
  startAt: RunStart,
  states: readonly ChallengeState[],
  tiers: readonly Tier[],
): number {
  if (startAt === 'start') return 0
  if (startAt === 'continue') return continueIndex(states)
  const at = tiers.indexOf(startAt)
  // A missing tier, or a boss that is still locked, falls back to Continue.
  if (
    at === -1 ||
    (startAt === 'boss' && bossState(states, tiers) === 'locked')
  ) {
    return continueIndex(states)
  }
  return at
}

/**
 * State for one play-through of a game's challenges:
 * answer → submit once → feedback → next → ... → finished.
 * Games decide whether an answer is correct; saved progress decides the
 * XP and mastery, and where Continue starts.
 */
export function useChallengeRun(
  game: GameId,
  challenges: readonly { id: string; tier?: Tier }[],
  startAt: RunStart = 'continue',
) {
  const { progress, answer, finishRun } = useProgress()
  const ids = challenges.map((c) => c.id)
  const tiers = challenges.map(tierOf)
  const states = gameStates(progress, game, ids)

  // Fixed when the run begins; later answers must not move them.
  const [start] = useState(() => startIndex(startAt, states, tiers))
  // A run plays one tier section: CORE, ADVANCED or the BOSS.
  const { tier: section, end } = sectionOf(tiers, start)
  const [replay] = useState(() => {
    const status = gameStatus(states)
    return status === 'complete' || status === 'mastered'
  })

  const [index, setIndex] = useState(start)
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

  const isLast = index === end

  /**
   * Records the answer once; later calls for the same challenge are ignored.
   * Screens only enable submitting once the player has an answer.
   */
  function submit(isCorrect: boolean, hinted = false) {
    if (result) return
    const outcome = answer(game, ids[index], isCorrect, hinted)
    setResult({ correct: isCorrect, ...outcome })
    setRunXp((sum) => sum + outcome.xpEarned)
    if (isCorrect) setCorrect((n) => n + 1)
  }

  /**
   * After a wrong answer, lets the player try the same challenge again
   * ("write" modules). The wrong attempt stays recorded.
   */
  function retry() {
    if (result && !result.correct) setResult(null)
  }

  function next() {
    if (!result) return
    if (isLast) {
      finishRun(game, { fullRun: start === 0, correct })
      setFinished(true)
      return
    }
    setIndex(index + 1)
    setResult(null)
  }

  const stats: RunStats = {
    played: index - start + 1,
    correct,
    runXp,
    replay,
    section,
  }

  return {
    index,
    isLast,
    result,
    finished,
    /** Saved state of every challenge, for the HUD. */
    states,
    stats,
    titleRef,
    feedbackRef,
    submit,
    retry,
    next,
  }
}
