import { getChoice, type Choice } from './choice.ts'

/** Marks the gap in a lock's code that the chosen option fills. */
export const CODE_SLOT = '____'

/** A condition, operator, or predicted output the player can choose. */
export interface LockOption extends Choice {
  code: string
}

export interface CodeBreakerChallenge {
  id: string
  /** Name of the security system being broken. */
  system: string
  concept: string
  /** Short concept primer. Backticks mark inline code. */
  lesson: string
  /** The security rule the player has to reason about. */
  rule: string
  /** Current values in the system, shown as a readout. */
  state: { name: string; value: string }[]
  /** Lock code. May contain CODE_SLOT, which the chosen option fills. */
  code: string[]
  /** The question the player answers. */
  prompt: string
  options: LockOption[]
  correctOptionId: string
  explanation: {
    /** Step-by-step evaluation of the correct logic. */
    evaluation: string
    /** The general Python idea to take away. */
    concept: string
  }
}

export function isCorrectOption(
  challenge: CodeBreakerChallenge,
  optionId: string,
): boolean {
  return optionId === challenge.correctOptionId
}

export function getCorrectOption(challenge: CodeBreakerChallenge): LockOption {
  return getChoice(challenge.options, challenge.correctOptionId)
}

/** True when the player's choice is slotted into the code, false when they predict output. */
export function hasCodeSlot(challenge: CodeBreakerChallenge): boolean {
  return challenge.code.some((line) => line.includes(CODE_SLOT))
}
