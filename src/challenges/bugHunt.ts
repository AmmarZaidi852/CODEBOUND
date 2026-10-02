/** One candidate patch: replace a single line of the snippet with new code. */
export interface BugFix {
  id: string
  line: number
  code: string
  /** Shown when the player picks this fix and it is wrong. */
  whyNot?: string
}

export interface BugHuntChallenge {
  id: string
  concept: string
  title: string
  /** Short concept primer shown before the code. Backticks mark inline code. */
  lesson: string
  /** What the code is supposed to do. */
  mission: string
  code: string[]
  expectedOutput: string
  fixes: BugFix[]
  correctFixId: string
  explanation: {
    problem: string
    why: string
    fix: string
  }
}

export function isCorrectFix(
  challenge: BugHuntChallenge,
  fixId: string,
): boolean {
  return fixId === challenge.correctFixId
}

export function getCorrectFix(challenge: BugHuntChallenge): BugFix {
  const fix = challenge.fixes.find((f) => f.id === challenge.correctFixId)
  if (!fix) {
    throw new Error(`Challenge "${challenge.id}" has no correct fix`)
  }
  return fix
}
