import { getChoice, type Choice } from './choice.ts'

/** Marks the gap in a module's code that the player's answer fills. */
export const FORGE_SLOT = '____'

export interface ForgeOption extends Choice {
  code: string
}

/** Tap code tokens, in order, to forge a function (or part of one). */
export interface AssembleTask {
  kind: 'assemble'
  /** Tokens the player can use, each at most once. Includes distractors. */
  tokens: string[]
  answer: string[]
}

/** Choose a line to slot into the code, or predict a result. */
export interface ChooseTask {
  kind: 'choose'
  /** The question. Backticks mark inline code. */
  prompt: string
  options: ForgeOption[]
  correctOptionId: string
}

/** Tap value tiles into a call's argument slots, in order. */
export interface ArgsTask {
  kind: 'args'
  /** Parameter names, one slot each. */
  params: string[]
  /** Python literals the player can pass, each at most once. */
  tiles: string[]
  answer: string[]
  /** The output the call must produce. */
  target: string
  /**
   * What this particular tiny Python function returns for the given
   * arguments, mirrored in TypeScript. Used to show the player what their
   * own call produced. Not a Python interpreter.
   */
  run: (args: readonly string[]) => string
}

export type ForgeTask = AssembleTask | ChooseTask | ArgsTask

export type ForgeAnswer =
  | { kind: 'assemble'; tokens: string[] }
  | { kind: 'choose'; optionId: string }
  | { kind: 'args'; args: string[] }

export interface FunctionForgeChallenge {
  id: string
  /** Short module label, e.g. "Module 01". */
  module: string
  title: string
  concept: string
  /** Short concept primer. Backticks mark inline code. */
  lesson: string
  /** What the player has to do. Backticks mark inline code. */
  instruction: string
  /** Module code. May contain FORGE_SLOT, which the player's answer fills. */
  code: string[]
  /** The call shown as INPUT → FUNCTION → OUTPUT, if there is one. */
  call: { name: string; args: string[]; output: string } | null
  task: ForgeTask
  explanation: {
    /** How the correct code works, step by step. */
    steps: string
    /** The rule to remember. */
    concept: string
    /** Shown on a wrong assemble/args answer. Choose options have their own. */
    mistake: string
  }
}

export function isCorrectForgeAnswer(
  challenge: FunctionForgeChallenge,
  answer: ForgeAnswer,
): boolean {
  const { task } = challenge
  if (task.kind === 'assemble' && answer.kind === 'assemble') {
    return sameItems(answer.tokens, task.answer)
  }
  if (task.kind === 'choose' && answer.kind === 'choose') {
    return answer.optionId === task.correctOptionId
  }
  if (task.kind === 'args' && answer.kind === 'args') {
    return sameItems(answer.args, task.answer)
  }
  return false
}

function sameItems(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((item, i) => item === b[i])
}

/**
 * Joins tokens into Python source with normal spacing:
 * ["def", "add", "(", "a", ",", "b", ")", ":", "return", "a + b"]
 * → "def add(a, b):\n    return a + b"
 */
export function formatTokens(tokens: readonly string[]): string {
  let out = ''
  tokens.forEach((token, i) => {
    if (token === ':') {
      out += ':'
      if (i < tokens.length - 1) out += '\n    '
      return
    }
    const noSpace =
      out === '' ||
      out.endsWith('(') ||
      out.endsWith('\n    ') ||
      [')', ',', '('].includes(token)
    out += (noSpace ? '' : ' ') + token
  })
  return out
}

/** Code lines with the slot replaced by `value` (which may span lines). */
export function fillSlot(code: readonly string[], value: string): string[] {
  return code.flatMap((line) => line.replace(FORGE_SLOT, value).split('\n'))
}

/** The correct answer written out as code, for feedback. */
export function correctForgeCode(challenge: FunctionForgeChallenge): string {
  const { task } = challenge
  switch (task.kind) {
    case 'assemble':
      return formatTokens(task.answer)
    case 'choose':
      return getChoice(task.options, task.correctOptionId).code
    case 'args':
      return `${challenge.call?.name}(${task.answer.join(', ')})`
  }
}
