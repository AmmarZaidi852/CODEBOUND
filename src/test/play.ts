import { fireEvent, screen } from '@testing-library/react'
import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import { isCodeChallenge, type CodeChallenge } from '../challenges/code.ts'

/*
 * Answers modules the way a player would, for app-level tests that play
 * through real games (choice modules and "write" modules alike).
 */

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))

/** Types `source` into the code terminal and presses Check. */
export function writeCode(source: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: source } })
  click('Check code')
}

/** A changed-but-wrong submission: the starter code plus a comment. */
export const wrongCode = (c: CodeChallenge) =>
  `${c.starter.join('\n')}\n# not fixed yet`

export function answerCode(c: CodeChallenge, correct: boolean) {
  writeCode(correct ? c.solution.join('\n') : wrongCode(c))
}

/** Answers one Bug Hunt module: pick a patch, or write the fix. */
export function answerBugHunt(
  module: BugHuntChallenge | CodeChallenge,
  correct: boolean,
) {
  if (isCodeChallenge(module)) {
    answerCode(module, correct)
    return
  }
  const fix = module.fixes.find(
    (f) => (f.id === module.correctFixId) === correct,
  )!
  fireEvent.click(
    screen.getByRole('radio', { name: `Line ${fix.line} ${fix.code}` }),
  )
  click('Apply patch')
}

/** Moves on from a result: Next challenge, or Finish on the last module. */
export function nextModule(isLast: boolean) {
  // A missed write module offers Try again / Show solution first.
  const reveal = screen.queryByRole('button', { name: 'Show solution' })
  if (reveal) fireEvent.click(reveal)
  click(isLast ? 'Finish' : 'Next challenge')
}
