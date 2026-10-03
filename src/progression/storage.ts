import type { ConceptId } from '../challenges/foundations.ts'
import { foundations } from '../content/foundations.ts'
import { games, type GameId } from '../content/games.ts'
import {
  newProgress,
  PROGRESS_VERSION,
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

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const count = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0

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
      if (!isRecord(value) || !gameIds.has(key.split(':')[0])) continue
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
