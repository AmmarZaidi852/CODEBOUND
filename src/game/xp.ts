export const XP_CORRECT = 100
export const XP_INCORRECT = 25
export const XP_PER_LEVEL = 300

/** XP awarded for finishing a challenge. Failing still teaches something, so it still pays a little. */
export function xpForResult(correct: boolean): number {
  return correct ? XP_CORRECT : XP_INCORRECT
}

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

/** Progress through the current level, from 0 to 1. */
export function levelProgress(xp: number): number {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL
}
