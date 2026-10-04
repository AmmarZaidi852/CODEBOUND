import { fireEvent, screen } from '@testing-library/react'
import type { BugHuntChallenge } from '../challenges/bugHunt.ts'
import { isCodeChallenge, type CodeChallenge } from '../challenges/code.ts'
import type { GameModule } from '../challenges/interaction.ts'

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
    // Accessible names collapse whitespace, e.g. an indented patch line.
    screen.getByRole('radio', {
      name: `Line ${fix.line} ${fix.code}`.replace(/\s+/g, ' ').trim(),
    }),
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

/**
 * Answers any module the way a player would, whichever game it comes
 * from (used by the Arcade Run, which mixes them).
 */
export function answerModule(module: GameModule, correct: boolean) {
  if (isCodeChallenge(module) || 'fixes' in module) {
    answerBugHunt(module, correct)
    return
  }
  if ('rule' in module) {
    const option = module.options.find(
      (o) => (o.id === module.correctOptionId) === correct,
    )!
    fireEvent.click(screen.getByRole('radio', { name: option.code }))
    click('Attempt unlock')
    return
  }
  if ('input' in module) {
    const { task } = module
    if (task.kind === 'pick') {
      const at = correct
        ? task.answerIndex
        : (task.answerIndex + 1) % module.input.length
      const value = module.input[at]
      click(module.showIndexes ? `Index ${at}: ${value}` : String(value))
    } else {
      for (const value of correct ? task.answer : [...task.answer].reverse()) {
        fireEvent.click(
          screen
            .getAllByRole('button', { name: `Add ${value}` })
            .find((b) => !(b as HTMLButtonElement).disabled)!,
        )
      }
    }
    click('Submit')
    return
  }
  const { task } = module
  if (task.kind !== 'choose') {
    throw new Error(`answerModule: ${task.kind} modules are not supported`)
  }
  const option = task.options.find(
    (o) => (o.id === task.correctOptionId) === correct,
  )!
  fireEvent.click(screen.getByRole('radio', { name: option.code }))
  click('Run module')
}
