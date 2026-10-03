import type { ConceptId } from './foundations.ts'

/*
 * Curriculum metadata every challenge declares, whatever its game or
 * interaction. Lives on the challenge object itself (one source of truth).
 */

/** CORE: one idea. ADVANCED: two ideas combined. BOSS: several, one real problem. */
export type Tier = 'core' | 'advanced' | 'boss'

/** How the player answers: pick, assemble, foresee the result, or type code. */
export type Interaction = 'choose' | 'build' | 'predict' | 'write'

export interface ChallengeMeta {
  /** Difficulty. Omitted means CORE. */
  tier?: Tier
  /** The Python Foundations concepts the challenge uses. */
  concepts: ConceptId[]
}

export const TIERS: readonly Tier[] = ['core', 'advanced', 'boss']

export const tierOf = (challenge: { tier?: Tier }): Tier =>
  challenge.tier ?? 'core'

export const tierLabels: Record<Tier, string> = {
  core: 'Core',
  advanced: 'Advanced',
  boss: 'Boss',
}

/** Extra mission-panel class for a tier: the boss gets its own frame. */
export const missionTier = (tier?: Tier) =>
  tier === 'boss' ? ' mission--boss' : ''
