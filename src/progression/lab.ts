import type { ConceptId } from '../challenges/foundations.ts'
import type { GameModule } from '../challenges/interaction.ts'
import { tierOf, type Tier } from '../challenges/meta.ts'
import { arcadeModules } from '../content/arcade.ts'
import { foundations } from '../content/foundations.ts'
import { gameModules } from '../content/gameChallenges.ts'
import { games } from '../content/games.ts'
import { arcadeUnlocked } from './arcade.ts'
import {
  bossState,
  challengeKey,
  challengeState,
  type ChallengeSource,
  type ChallengeState,
  type Progress,
} from './progress.ts'

/*
 * Mastery Lab: "what should I practise next?", worked out from saved
 * progress alone. Nothing here is stored; the same progress always gives
 * the same recommendations. Practising a module records it exactly as
 * its own game does (same challenge record, same XP rules).
 */

/** One module anywhere in CODEBOUND, with where it lives. */
export interface LabModule {
  source: ChallengeSource
  id: string
  module: GameModule
  tier: Tier
  /** Position in its game's module list (or in the Arcade Run). */
  index: number
  state: ChallengeState
  /** Answered at least once (a saved record exists). */
  attempted: boolean
}

/** Why a module is recommended, most urgent first. */
export type LabPriority =
  | 'missed' // 1. attempted, still not solved
  | 'not-mastered' // 2. a core module solved with a hint, not cleared yet
  | 'advanced' // 3. an advanced module solved, not cleared yet
  | 'boss' // 4. a boss solved, not cleared yet
  | 'new' // 5. unlocked, never played
  | 'recovered' // 6. missed once, cleared later by a clean solve
  | 'mastered' // 7. first try, no hint

const PRIORITY_ORDER: readonly LabPriority[] = [
  'missed',
  'not-mastered',
  'advanced',
  'boss',
  'new',
  'recovered',
  'mastered',
]

export const priorityLabels: Record<LabPriority, string> = {
  missed: 'Missed before',
  'not-mastered': 'Not mastered',
  advanced: 'Advanced practice',
  boss: 'Boss practice',
  new: 'New challenge',
  recovered: 'Recovered',
  mastered: 'Mastered',
}

export interface LabTarget extends LabModule {
  priority: LabPriority
}

const SOURCE_ORDER: readonly ChallengeSource[] = [
  ...games.map((g) => g.id),
  'arcade',
]

/** Every released module, in game order then play order. */
function allModules(progress: Progress): LabModule[] {
  const describe = (
    source: ChallengeSource,
    module: GameModule,
    index: number,
  ): LabModule => {
    const record = progress.challenges[challengeKey(source, module.id)]
    return {
      source,
      id: module.id,
      module,
      tier: tierOf(module),
      index,
      state: challengeState(record),
      attempted: record !== undefined,
    }
  }
  const fromGames = games
    .filter((g) => g.playable)
    .flatMap((g) => gameModules[g.id].map((m, i) => describe(g.id, m, i)))
  const fromArcade = arcadeModules
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) => m.source === 'arcade')
    .map((m) => describe('arcade', m.module, m.index))
  return [...fromGames, ...fromArcade]
}

/**
 * Whether the player can open a module now, mirroring the games:
 * Core is always open, Advanced once that game's Core is complete, the
 * Boss once it is ready, Arcade-only modules once the Arcade unlocks.
 */
function isUnlocked(m: LabModule, all: LabModule[], progress: Progress) {
  if (m.source === 'arcade') return arcadeUnlocked(progress)
  if (m.tier === 'core') return true
  const game = all.filter((x) => x.source === m.source)
  const states = game.map((x) => x.state)
  const tiers = game.map((x) => x.tier)
  if (m.tier === 'boss') return bossState(states, tiers) !== 'locked'
  return game.every((x) => x.tier !== 'core' || x.state !== 'unplayed')
}

function priorityOf(m: LabModule): LabPriority {
  if (m.state === 'mastered') return 'mastered'
  if (m.state === 'recovered') return 'recovered'
  if (m.state === 'unplayed') return m.attempted ? 'missed' : 'new'
  if (m.tier === 'boss') return 'boss'
  if (m.tier === 'advanced') return 'advanced'
  return 'not-mastered'
}

/**
 * Every unlocked module, ranked by priority. Ties go round-robin across
 * games (each game's first module, then each game's second, ...), then
 * by game order, so the list mixes areas instead of draining one game.
 */
export function labRanking(progress: Progress): LabTarget[] {
  const all = allModules(progress)
  const targets = all
    .filter((m) => isUnlocked(m, all, progress))
    .map((m) => ({ ...m, priority: priorityOf(m) }))

  // Each target's position among same-priority targets of its own source.
  const turn = new Map<LabTarget, number>()
  const seen = new Map<string, number>()
  for (const t of targets) {
    const key = `${t.priority}|${t.source}`
    const n = seen.get(key) ?? 0
    turn.set(t, n)
    seen.set(key, n + 1)
  }

  return [...targets].sort(
    (a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
      turn.get(a)! - turn.get(b)! ||
      SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source),
  )
}

/** The Lab opens once the player has solved at least one challenge. */
export const labAvailable = (progress: Progress) =>
  Object.values(progress.challenges).some((r) => r.solved)

/** Cleared modules are done: mastered first try, or recovered later. */
const isCleared = (t: { state: ChallengeState }) =>
  t.state === 'mastered' || t.state === 'recovered'

/** The next modules worth practising (never cleared ones). */
export function labQueue(progress: Progress, limit = 5): LabTarget[] {
  return labRanking(progress)
    .filter((t) => !isCleared(t))
    .slice(0, limit)
}

/** Modules answered before but not cleared yet. */
export const needsPracticeCount = (progress: Progress) =>
  labRanking(progress).filter((t) => !isCleared(t) && t.priority !== 'new')
    .length

/** Every released module is first-try mastered (so all are unlocked, too). */
export const allMastered = (progress: Progress) =>
  allModules(progress).every((m) => m.state === 'mastered')

/** Every released module is cleared: mastered or recovered. */
export const allCleared = (progress: Progress) =>
  allModules(progress).every(isCleared)

/** How many released modules are first-try mastered, and how many recovered. */
export function clearedCounts(progress: Progress) {
  const all = allModules(progress)
  return {
    mastered: all.filter((m) => m.state === 'mastered').length,
    recovered: all.filter((m) => m.state === 'recovered').length,
    total: all.length,
  }
}

export type ConceptLabel = 'mastered' | 'recovered' | 'practice' | 'new'

export interface ConceptStatus {
  id: ConceptId
  title: string
  /** Modules using this concept: first-try mastered, recovered, all. */
  mastered: number
  recovered: number
  total: number
  /** Saved states of those modules, for the bar. */
  states: ChallengeState[]
  /** Whether the Foundations lesson is complete. */
  learned: boolean
  label: ConceptLabel
}

/** Each Foundations concept, from the saved state of every module using it. */
export function conceptStatus(progress: Progress): ConceptStatus[] {
  const all = allModules(progress)
  return foundations.map((c) => {
    const using = all.filter((m) => m.module.concepts.includes(c.id))
    const mastered = using.filter((m) => m.state === 'mastered').length
    const recovered = using.filter((m) => m.state === 'recovered').length
    const label: ConceptLabel =
      mastered === using.length
        ? 'mastered'
        : mastered + recovered === using.length
          ? 'recovered'
          : using.some((m) => m.attempted)
            ? 'practice'
            : 'new'
    const rank = { mastered: 0, recovered: 1, completed: 2, unplayed: 3 }
    return {
      id: c.id,
      title: c.title,
      mastered,
      recovered,
      total: using.length,
      // Cleared first, so the bar fills from the left.
      states: using.map((m) => m.state).sort((a, b) => rank[a] - rank[b]),
      learned: progress.concepts.includes(c.id),
      label,
    }
  })
}

/** The top recommendations that use one concept. */
export function conceptTargets(
  progress: Progress,
  concept: ConceptId,
  limit = 3,
): LabTarget[] {
  return labRanking(progress)
    .filter((t) => !isCleared(t) && t.module.concepts.includes(concept))
    .slice(0, limit)
}

/** One module by reference, with its saved state (what practice opens). */
export function findLabModule(
  progress: Progress,
  ref: { source: ChallengeSource; id: string },
): LabModule | undefined {
  return allModules(progress).find(
    (m) => m.source === ref.source && m.id === ref.id,
  )
}

/**
 * Saved states of the list a module belongs to (its game, or the Arcade
 * Run), so practice shows the same HUD as playing it there.
 */
export function homeStates(
  progress: Progress,
  source: ChallengeSource,
): ChallengeState[] {
  const list: { source: ChallengeSource; id: string }[] =
    source === 'arcade'
      ? [...arcadeModules]
      : gameModules[source].map((m) => ({ source, id: m.id }))
  return list.map((m) =>
    challengeState(progress.challenges[challengeKey(m.source, m.id)]),
  )
}
