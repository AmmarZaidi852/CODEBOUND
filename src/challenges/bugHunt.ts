import { getChoice, type Choice } from './choice.ts'

/** One candidate patch: replace a single line of the snippet with new code. */
export interface BugFix extends Choice {
  line: number
  code: string
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
  return getChoice(challenge.fixes, challenge.correctFixId)
}
