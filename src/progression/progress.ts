import type { ConceptId } from '../challenges/foundations.ts'
import type { GameId } from '../content/games.ts'
import { XP_CONCEPT, xpForResult } from '../game/xp.ts'

/*
 * The player's saved progress, and the pure rules that change it.
 * Level is not stored: it is always derived from XP (see game/xp.ts).
 */

export const PROGRESS_VERSION = 1

/** What the player has done with one challenge. Absent = never attempted. */
export interface ChallengeRecord {
  /** Answered correctly at least once. */
  solved: boolean
  /** The very first attempt was correct. Can never be earned later. */
  mastered: boolean
  /** XP this challenge has paid out so far (capped at its best result). */
  xp: number
}

export interface GameRecord {
  /** Runs played through to the completion screen. */
  runs: number
  /** Most correct answers in one full run (started from module 01). */
  bestRun: number
}

export interface Progress {
  version: typeof PROGRESS_VERSION
  xp: number
  /** Completed Foundations concepts, in completion order. */
  concepts: ConceptId[]
  /** Keyed by challengeKey(game, challengeId). */
  challenges: Record<string, ChallengeRecord>
  games: Partial<Record<GameId, GameRecord>>
}

export type ChallengeState = 'unplayed' | 'completed' | 'mastered'
export type GameStatus = 'new' | 'in-progress' | 'complete' | 'mastered'

export interface AnswerOutcome {
  xpEarned: number
  /** This answer earned mastery (first attempt, correct). */
  mastered: boolean
  /** The challenge had been attempted before. */
  replay: boolean
}

export function newProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    xp: 0,
    concepts: [],
    challenges: {},
    games: {},
  }
}

export const challengeKey = (game: GameId, challengeId: string) =>
  `${game}:${challengeId}`

export function challengeState(
  record: ChallengeRecord | undefined,
): ChallengeState {
  if (!record?.solved) return 'unplayed'
  return record.mastered ? 'mastered' : 'completed'
}

/**
 * Records one answer. A challenge pays out the XP of its best result once:
 * first attempt +100 / +25 as before; solving a missed challenge later tops
 * it up to 100 (+75); anything else pays nothing, so replays cannot farm XP.
 */
export function applyAnswer(
  progress: Progress,
  game: GameId,
  challengeId: string,
  correct: boolean,
): { progress: Progress; outcome: AnswerOutcome } {
  const key = challengeKey(game, challengeId)
  const prev = progress.challenges[key]
  const paid = prev?.xp ?? 0
  const xpEarned = Math.max(0, xpForResult(correct) - paid)
  const record: ChallengeRecord = {
    solved: (prev?.solved ?? false) || correct,
    mastered: prev ? prev.mastered : correct,
    xp: paid + xpEarned,
  }
  return {
    progress: {
      ...progress,
      xp: progress.xp + xpEarned,
      challenges: { ...progress.challenges, [key]: record },
    },
    outcome: {
      xpEarned,
      mastered: !prev && correct,
      replay: prev !== undefined,
    },
  }
}

/** Marks a concept done. Pays XP_CONCEPT the first time only. */
export function applyConcept(
  progress: Progress,
  id: ConceptId,
): { progress: Progress; xpEarned: number } {
  if (progress.concepts.includes(id)) return { progress, xpEarned: 0 }
  return {
    progress: {
      ...progress,
      xp: progress.xp + XP_CONCEPT,
      concepts: [...progress.concepts, id],
    },
    xpEarned: XP_CONCEPT,
  }
}

/** Records a finished run. Only full runs (from module 01) set the best. */
export function applyRunEnd(
  progress: Progress,
  game: GameId,
  run: { fullRun: boolean; correct: number },
): Progress {
  const prev = progress.games[game] ?? { runs: 0, bestRun: 0 }
  return {
    ...progress,
    games: {
      ...progress.games,
      [game]: {
        runs: prev.runs + 1,
        bestRun: run.fullRun
          ? Math.max(prev.bestRun, run.correct)
          : prev.bestRun,
      },
    },
  }
}

/** Per-challenge states for one game, in challenge order. */
export function gameStates(
  progress: Progress,
  game: GameId,
  challengeIds: readonly string[],
): ChallengeState[] {
  return challengeIds.map((id) =>
    challengeState(progress.challenges[challengeKey(game, id)]),
  )
}

export function gameStatus(states: readonly ChallengeState[]): GameStatus {
  const done = states.filter((s) => s !== 'unplayed').length
  if (done === 0) return 'new'
  if (done < states.length) return 'in-progress'
  return states.every((s) => s === 'mastered') ? 'mastered' : 'complete'
}

/** Where Continue starts: the first unfinished challenge, or 0 if all are done. */
export function continueIndex(states: readonly ChallengeState[]): number {
  const index = states.indexOf('unplayed')
  return index === -1 ? 0 : index
}
