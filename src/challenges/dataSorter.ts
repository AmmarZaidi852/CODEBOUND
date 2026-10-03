import type { ChallengeMeta } from './meta.ts'
import type { ListOp } from './listOps.ts'

/** Tap one cell of the input list. */
export interface PickTask {
  kind: 'pick'
  answerIndex: number
}

/** Build a list by tapping value tiles from a pool, in order. */
export interface BuildTask {
  kind: 'build'
  /** Tiles the player can use, each at most once. Includes distractors. */
  pool: number[]
  answer: number[]
  /** Label for the list being built, e.g. "scores" or "Printed values". */
  targetLabel: string
}

export type DataTask = PickTask | BuildTask

/** What the player has submitted: a tapped index, or the list they built. */
export type DataAnswer =
  { kind: 'pick'; index: number } | { kind: 'build'; values: number[] }

export interface DataSorterChallenge extends ChallengeMeta {
  id: string
  name: string
  concept: string
  /** Short concept primer. Backticks mark inline code. */
  lesson: string
  /** Name of the list variable, shown next to the cells. */
  variable: string
  /** The list as it starts, shown as cells. */
  input: number[]
  showIndexes: boolean
  code: string[]
  /** Instruction for the player. Backticks mark inline code. */
  instruction: string
  task: DataTask
  /** Operations the code performs on `input`, when it changes the list. */
  ops?: ListOp[]
  /** The list (or printed values) after the code runs, shown in feedback. Label e.g. "scores =". */
  result: { label: string; values: number[] }
  explanation: {
    /** What the code did, step by step. */
    steps: string
    /** The rule to remember. */
    concept: string
    /** Shown on a wrong answer: the usual mistake and why it fails. */
    mistake: string
  }
}

export function isCorrectAnswer(
  challenge: DataSorterChallenge,
  answer: DataAnswer,
): boolean {
  const { task } = challenge
  if (task.kind === 'pick' && answer.kind === 'pick') {
    return answer.index === task.answerIndex
  }
  if (task.kind === 'build' && answer.kind === 'build') {
    return sameValues(answer.values, task.answer)
  }
  return false
}

export function sameValues(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

/** Formats values the way Python prints a list: [12, 18, 7]. */
export function formatList(values: readonly number[]): string {
  return `[${values.join(', ')}]`
}
