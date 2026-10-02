import type { GameId } from '../content/games.ts'
import { getChoice, type Choice } from './choice.ts'

export type ConceptId =
  | 'variables'
  | 'data-types'
  | 'operators'
  | 'conditions'
  | 'lists'
  | 'indexing'
  | 'loops'
  | 'functions'

export interface MicroOption extends Choice {
  code: string
}

/** Choose the right output / value / type from a few options. */
export interface ChoiceMicro {
  kind: 'choice'
  /** The question. Backticks mark inline code. */
  prompt: string
  /** Optional code the question is about. */
  code?: string[]
  options: MicroOption[]
  correctOptionId: string
}

/** Tap the right cell of a list. */
export interface PickMicro {
  kind: 'pick'
  prompt: string
  list: { label: string; values: number[] }
  answerIndex: number
  /** Shown on a wrong pick. */
  whyNot: string
}

export type MicroChallenge = ChoiceMicro | PickMicro

export type MicroAnswer =
  { kind: 'choice'; optionId: string } | { kind: 'pick'; index: number }

/** One short Python Foundations lesson: concept → tiny example → micro-challenge → game. */
export interface Concept {
  id: ConceptId
  title: string
  /** One-sentence explanation. Backticks mark inline code. */
  summary: string
  example: string[]
  /** What the example does, in a sentence or two. */
  exampleNote: string
  micro: MicroChallenge
  /** Explanation shown after answering, right or wrong. */
  explanation: string
  /** The game that practises this concept, if any. */
  game: GameId | null
}

export function isCorrectMicro(
  micro: MicroChallenge,
  answer: MicroAnswer,
): boolean {
  if (micro.kind === 'choice' && answer.kind === 'choice') {
    return answer.optionId === micro.correctOptionId
  }
  if (micro.kind === 'pick' && answer.kind === 'pick') {
    return answer.index === micro.answerIndex
  }
  return false
}

/** The correct answer, written out for feedback. */
export function correctAnswerText(micro: MicroChallenge): string {
  if (micro.kind === 'choice') {
    return getChoice(micro.options, micro.correctOptionId).code
  }
  return `${micro.list.values[micro.answerIndex]} (index ${micro.answerIndex})`
}
