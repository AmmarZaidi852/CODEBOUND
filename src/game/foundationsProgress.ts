import type { Concept, ConceptId } from '../challenges/foundations.ts'

/**
 * Simple sequential progression: the first concept is always open, and each
 * later concept opens once the one before it is completed. Completed concepts
 * stay open for review.
 */
export function isConceptUnlocked(
  concepts: readonly Concept[],
  completed: readonly ConceptId[],
  id: ConceptId,
): boolean {
  const index = concepts.findIndex((c) => c.id === id)
  if (index <= 0) return index === 0
  return completed.includes(concepts[index - 1].id)
}

/** The first concept not yet completed, or null when everything is done. */
export function currentConcept(
  concepts: readonly Concept[],
  completed: readonly ConceptId[],
): Concept | null {
  return concepts.find((c) => !completed.includes(c.id)) ?? null
}

export function nextConcept(
  concepts: readonly Concept[],
  id: ConceptId,
): Concept | null {
  const index = concepts.findIndex((c) => c.id === id)
  return concepts[index + 1] ?? null
}

export function foundationsProgress(
  concepts: readonly Concept[],
  completed: readonly ConceptId[],
) {
  const done = concepts.filter((c) => completed.includes(c.id)).length
  return { done, total: concepts.length }
}
