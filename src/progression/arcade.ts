import { gameChallengeIds, gameModuleTiers } from '../content/gameChallenges.ts'
import { games } from '../content/games.ts'
import {
  applyAnswer,
  gameStates,
  type AnswerOutcome,
  type ArcadeBest,
  type ArcadeRun,
  type ChallengeSource,
  type Progress,
} from './progress.ts'

/*
 * Arcade Run rules. The run is only an order of existing challenges:
 * every answer is recorded by applyAnswer under the challenge's own
 * source, so XP, mastery and replays follow the normal rules. The run
 * itself only tracks where the player is and how this run went.
 */

export type ArcadeStatus = 'locked' | 'new' | 'in-progress' | 'complete'

/** How many games have every CORE module complete. */
export function coreGamesComplete(progress: Progress): number {
  return games.filter((game) => {
    const states = gameStates(progress, game.id, gameChallengeIds[game.id])
    const tiers = gameModuleTiers[game.id]
    return states.every((s, i) => tiers[i] !== 'core' || s !== 'unplayed')
  }).length
}

/** The Arcade unlocks once every CORE module of all four games is complete. */
export const arcadeUnlocked = (progress: Progress) =>
  coreGamesComplete(progress) === games.length

export function arcadeStatus(progress: Progress): ArcadeStatus {
  if (progress.arcade.run) return 'in-progress'
  if (progress.arcade.runs > 0) return 'complete'
  return arcadeUnlocked(progress) ? 'new' : 'locked'
}

const freshRun = (): ArcadeRun => ({
  at: 0,
  tries: 0,
  correct: 0,
  firstTry: 0,
  checks: 0,
  correctChecks: 0,
  xp: 0,
})

/** Starts a new run at module 01, replacing any run in progress. */
export function startArcade(progress: Progress): Progress {
  return { ...progress, arcade: { ...progress.arcade, run: freshRun() } }
}

/** Correct checks as a whole percentage of all checks. */
export const accuracyOf = (run: ArcadeRun) =>
  run.checks === 0 ? 0 : Math.round((100 * run.correctChecks) / run.checks)

export const bestOf = (run: ArcadeRun): ArcadeBest => ({
  correct: run.correct,
  firstTry: run.firstTry,
  accuracy: accuracyOf(run),
})

/** True when `a` beats `b`: more correct, then more first-try, then accuracy. */
export function isBetterRun(a: ArcadeBest, b: ArcadeBest | null): boolean {
  if (!b) return true
  if (a.correct !== b.correct) return a.correct > b.correct
  if (a.firstTry !== b.firstTry) return a.firstTry > b.firstTry
  return a.accuracy > b.accuracy
}

/** Ends the run: counts it and keeps it if it beats the best run. */
function finish(progress: Progress, run: ArcadeRun): Progress {
  const { arcade } = progress
  const best = bestOf(run)
  return {
    ...progress,
    arcade: {
      run: null,
      runs: arcade.runs + 1,
      best: isBetterRun(best, arcade.best) ? best : arcade.best,
    },
  }
}

/** Moves the run past module `at`, finishing it after the last one. */
function advance(progress: Progress, run: ArcadeRun, total: number): Progress {
  const next = { ...run, at: run.at + 1, tries: 0 }
  if (next.at >= total) return finish(progress, next)
  return { ...progress, arcade: { ...progress.arcade, run: next } }
}

export interface ArcadeAnswer {
  correct: boolean
  /** A hint was opened before this answer. */
  hinted: boolean
  /** A wrong answer can be checked again (write modules). */
  canRetry: boolean
}

/**
 * Records one answer to the current module (`run.at`).
 * The challenge is recorded exactly as in its own game. The run moves on
 * once the module is settled: solved, or answered wrong with no retry.
 * `finished` is the completed run's stats when this answer ended it.
 */
export function applyArcadeAnswer(
  progress: Progress,
  ref: { source: ChallengeSource; id: string },
  total: number,
  answer: ArcadeAnswer,
): { progress: Progress; outcome: AnswerOutcome; finished: ArcadeRun | null } {
  const run = progress.arcade.run
  const recorded = applyAnswer(
    progress,
    ref.source,
    ref.id,
    answer.correct,
    answer.hinted,
  )
  if (!run) return { ...recorded, finished: null }

  const { correct, hinted } = answer
  const counted: ArcadeRun = {
    ...run,
    tries: run.tries + 1,
    correct: run.correct + (correct ? 1 : 0),
    firstTry: run.firstTry + (correct && run.tries === 0 && !hinted ? 1 : 0),
    checks: run.checks + 1,
    correctChecks: run.correctChecks + (correct ? 1 : 0),
    xp: run.xp + recorded.outcome.xpEarned,
  }
  const settled = correct || !answer.canRetry
  if (!settled) {
    return {
      progress: {
        ...recorded.progress,
        arcade: { ...recorded.progress.arcade, run: counted },
      },
      outcome: recorded.outcome,
      finished: null,
    }
  }
  const next = advance(recorded.progress, counted, total)
  return {
    progress: next,
    outcome: recorded.outcome,
    finished: next.arcade.run ? null : { ...counted, at: total, tries: 0 },
  }
}

/**
 * Leaves module `index` unsolved (e.g. after Show solution). Does nothing
 * if that module was already settled, so it is safe to call on every Next.
 */
export function leaveArcadeModule(
  progress: Progress,
  index: number,
  total: number,
): { progress: Progress; finished: ArcadeRun | null } {
  const run = progress.arcade.run
  if (!run || run.at !== index) return { progress, finished: null }
  const next = advance(progress, run, total)
  return {
    progress: next,
    finished: next.arcade.run ? null : { ...run, at: total, tries: 0 },
  }
}
