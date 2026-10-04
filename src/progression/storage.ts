import type { ConceptId } from '../challenges/foundations.ts'
import { arcadeModules } from '../content/arcade.ts'
import { foundations } from '../content/foundations.ts'
import { games, type GameId } from '../content/games.ts'
import {
  newProgress,
  PROGRESS_VERSION,
  type ArcadeBest,
  type ArcadeRecord,
  type ArcadeRun,
  type ChallengeRecord,
  type GameRecord,
  type Progress,
} from './progress.ts'

/*
 * localStorage persistence for Progress. The only module that touches
 * storage. Every read is validated: missing, corrupt, or unknown-version
 * data gives a fresh player instead of a crash.
 */

export const STORAGE_KEY = 'codebound.progress'

const conceptIds = new Set<string>(foundations.map((c) => c.id))
const gameIds = new Set<string>(games.map((g) => g.id))
/** Owners of saved challenge records: the games, plus the Arcade's own. */
const sources = new Set<string>([...gameIds, 'arcade'])

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const count = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0

function sanitizeArcadeRun(v: unknown): ArcadeRun | null {
  if (!isRecord(v)) return null
  const run: ArcadeRun = {
    at: count(v.at),
    tries: count(v.tries),
    correct: count(v.correct),
    firstTry: count(v.firstTry),
    checks: count(v.checks),
    correctChecks: count(v.correctChecks),
    xp: count(v.xp),
  }
  // Counts that cannot have come from real play mean the run is corrupt.
  const consistent =
    run.at < arcadeModules.length &&
    run.correctChecks <= run.checks &&
    run.correct <= run.correctChecks &&
    run.firstTry <= run.correct &&
    run.correct <= run.at
  return consistent ? run : null
}

function sanitizeArcadeBest(v: unknown): ArcadeBest | null {
  if (!isRecord(v)) return null
  const best = {
    correct: count(v.correct),
    firstTry: count(v.firstTry),
    accuracy: Math.min(100, count(v.accuracy)),
  }
  return best.firstTry <= best.correct ? best : null
}

function sanitizeArcade(v: unknown): ArcadeRecord {
  if (!isRecord(v)) return { run: null, runs: 0, best: null }
  return {
    run: sanitizeArcadeRun(v.run),
    runs: count(v.runs),
    best: sanitizeArcadeBest(v.best),
  }
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    // Blocked storage (privacy settings, sandboxed frames).
    return null
  }
}

/** Turns untrusted parsed JSON into a valid Progress, dropping bad parts. */
export function sanitize(data: unknown): Progress {
  if (!isRecord(data) || data.version !== PROGRESS_VERSION) {
    // Only one schema exists. Anything else starts a fresh player.
    return newProgress()
  }

  const concepts = Array.isArray(data.concepts)
    ? [...new Set(data.concepts)].filter(
        (id): id is ConceptId => typeof id === 'string' && conceptIds.has(id),
      )
    : []

  const challenges: Record<string, ChallengeRecord> = {}
  if (isRecord(data.challenges)) {
    for (const [key, value] of Object.entries(data.challenges)) {
      if (!isRecord(value) || !sources.has(key.split(':')[0])) continue
      const solved = value.solved === true
      challenges[key] = {
        solved,
        mastered: solved && value.mastered === true,
        xp: count(value.xp),
      }
    }
  }

  const gameRecords: Partial<Record<GameId, GameRecord>> = {}
  if (isRecord(data.games)) {
    for (const [id, value] of Object.entries(data.games)) {
      if (!isRecord(value) || !gameIds.has(id)) continue
      gameRecords[id as GameId] = {
        runs: count(value.runs),
        bestRun: count(value.bestRun),
      }
    }
  }

  return {
    version: PROGRESS_VERSION,
    xp: count(data.xp),
    concepts,
    challenges,
    games: gameRecords,
    // Optional: saves from before the Arcade simply have none yet.
    arcade: sanitizeArcade(data.arcade),
  }
}

export function loadProgress(): Progress {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : newProgress()
  } catch {
    return newProgress()
  }
}

export function saveProgress(progress: Progress): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Full or blocked storage: keep playing; progress lasts this session.
  }
}

/** Removes CODEBOUND's saved progress only. */
export function clearProgress(): void {
  try {
    storage()?.removeItem(STORAGE_KEY)
  } catch {
    // Nothing saved to clear.
  }
}
