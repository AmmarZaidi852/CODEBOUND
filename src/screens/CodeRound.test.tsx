import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { adder, doubler, ticketTotal } from '../content/codeChallenges.ts'
import { bugHuntModules } from '../content/gameChallenges.ts'
import {
  applyAnswer,
  challengeKey,
  newProgress,
} from '../progression/progress.ts'
import { loadProgress, saveProgress } from '../progression/storage.ts'
import { answerBugHunt, nextModule, writeCode } from '../test/play.ts'
import { expectStep } from '../test/progress.ts'
import { expectTotalXp, renderWithProgress } from '../test/render.tsx'
import BugHuntScreen from './BugHuntScreen.tsx'
import FunctionForgeScreen from './FunctionForgeScreen.tsx'

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }))
const editor = () => screen.getByRole('textbox') as HTMLTextAreaElement
const type = (value: string) =>
  fireEvent.change(editor(), { target: { value } })
const solution = (c: { solution: string[] }) => c.solution.join('\n')

function renderTicket() {
  renderWithProgress(
    <BugHuntScreen
      challenges={[ticketTotal]}
      onExit={vi.fn()}
      onPlayAgain={vi.fn()}
    />,
  )
}

describe('code terminal', () => {
  it('shows the starter code in a labelled editor tied to the mission', () => {
    renderTicket()
    expect(
      screen.getByRole('textbox', { name: 'ticket_total.py' }),
    ).toHaveValue(ticketTotal.starter.join('\n'))
    expect(editor()).toHaveAccessibleDescription(
      /Fix the code so it prints the cost of 3 tickets. Goal Prints 24/,
    )
    expect(screen.getByText('Write')).toBeInTheDocument()
  })

  it('enables Check only once the code changes, and Reset restores it', () => {
    renderTicket()
    const checkButton = screen.getByRole('button', { name: 'Check code' })
    const reset = screen.getByRole('button', { name: 'Reset' })
    expect(checkButton).toBeDisabled()
    expect(reset).toBeDisabled()
    expect(screen.getByText('Edit the code first')).toBeInTheDocument()

    type('price = 8\ncount = 3\ntotal = price * count\nprint(total)')
    expect(checkButton).toBeEnabled()
    expect(screen.getByText('Ready to check')).toBeInTheDocument()

    click('Reset')
    expect(editor()).toHaveValue(ticketTotal.starter.join('\n'))
    expect(checkButton).toBeDisabled()
  })

  it('keeps indentation on Enter and indents after a colon', () => {
    renderWithProgress(
      <FunctionForgeScreen
        challenges={[adder]}
        onExit={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )
    type('def add(a, b):')
    editor().setSelectionRange(14, 14)
    fireEvent.keyDown(editor(), { key: 'Enter' })
    expect(editor()).toHaveValue('def add(a, b):\n    ')
  })

  it('does not count opening, editing or resetting as an attempt', () => {
    renderTicket()
    type('total = 1')
    click('Reset')
    expect(loadProgress().challenges).toEqual({})
  })
})

describe('checking code', () => {
  it('accepts a correct first try as mastered', () => {
    renderTicket()
    type(solution(ticketTotal))
    click('Check code')
    expect(screen.getByText('System online')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Bug squashed!' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('System: Patched')
    expect(editor()).toHaveAttribute('readonly')
    expect(screen.getByText('How it works')).toBeInTheDocument()
  })

  it('explains a wrong check, keeps the answer hidden, and allows a retry', () => {
    renderTicket()
    type('price = 8\ncount = 3\ntotal = price - count\nprint(total)')
    click('Check code')
    expect(screen.getByText('System error')).toBeInTheDocument()
    expect(
      screen.getByText((_, el) =>
        el?.classList.contains('feedback__why-not')
          ? el.textContent === 'Your code printed 5. It should print 24.'
          : false,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('+25 XP')).toBeInTheDocument()
    expect(screen.queryByText('A working solution')).toBeNull()
    expect(screen.queryByText(/price \* count/)).toBeNull()

    click('Try again')
    expect(editor()).not.toHaveAttribute('readonly')
    // Unchanged code can't be re-checked by accident.
    expect(screen.getByRole('button', { name: 'Check code' })).toBeDisabled()

    type(solution(ticketTotal))
    click('Check code')
    expect(screen.getByText('+75 XP')).toBeInTheDocument()
    expect(
      screen.queryByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeNull()
    expectTotalXp(100)
    expect(
      loadProgress().challenges[challengeKey('bug-hunt', 'ticket-total')],
    ).toEqual({
      solved: true,
      mastered: false,
      xp: 100,
    })
  })

  it('a second wrong check pays nothing', () => {
    renderTicket()
    type('print(1)')
    click('Check code')
    click('Try again')
    type('print(2)')
    click('Check code')
    expect(screen.queryByText(/^\+\d+ XP$/)).toBeNull()
    expectTotalXp(25)
  })

  it('shows the solution only when asked, then moves on', () => {
    renderWithProgress(
      <BugHuntScreen
        challenges={[ticketTotal, ...bugHuntModules.slice(0, 1)]}
        onExit={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )
    type('print(1)')
    click('Check code')
    click('Show solution')
    expect(screen.getByText('A working solution')).toBeInTheDocument()
    expect(screen.getByText('total = price * count')).toBeInTheDocument()
    click('Next challenge')
    expectStep('Bug Hunt', 2, 2)
  })

  it('reports malformed and unsupported code safely', () => {
    renderTicket()
    type('print(')
    click('Check code')
    expect(screen.getByText('System error')).toBeInTheDocument()
    expect(
      screen.getByText(/SyntaxError/, { selector: '.code-round__error' }),
    ).toBeInTheDocument()

    click('Try again')
    type('import os')
    click('Check code')
    expect(
      screen.getByText(/not part of this terminal/, {
        selector: '.code-round__error',
      }),
    ).toBeInTheDocument()
  })

  it('shows what a function returned instead of printing', () => {
    renderWithProgress(
      <FunctionForgeScreen
        challenges={[doubler]}
        onExit={vi.fn()}
        onPlayAgain={vi.fn()}
      />,
    )
    type('def double(x):\n    print(x * 2)')
    click('Check code')
    expect(
      screen.getByRole('heading', { name: 'Module fault' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/printed/, { selector: '.feedback__why-not' }),
    ).toHaveTextContent(
      'double(4) printed 8 but returned None. Use return to send the value back.',
    )
  })
})

describe('hints', () => {
  it('reveal one at a time, up to three, without giving the answer', () => {
    renderTicket()
    expect(
      screen.getByText(
        'Hints are free, but a module solved with a hint is not mastered.',
      ),
    ).toBeInTheDocument()
    click('Show hint 1 of 3')
    const hints = () =>
      within(screen.getByRole('list')).getAllByRole('listitem')
    expect(hints()).toHaveLength(1)
    expect(
      screen.getByText(
        'Hint used: this module will not be mastered this time.',
      ),
    ).toBeInTheDocument()
    click('Show hint 2 of 3')
    click('Show hint 3 of 3')
    expect(hints()).toHaveLength(3)
    expect(
      screen.getByRole('button', { name: 'All hints shown' }),
    ).toBeDisabled()
    for (const hint of hints()) {
      expect(hint).not.toHaveTextContent('price * count')
    }
  })

  it('a hinted first-try success pays full XP but is not mastered', () => {
    renderTicket()
    click('Show hint 1 of 3')
    type(solution(ticketTotal))
    click('Check code')
    expect(screen.getByText('+100 XP')).toBeInTheDocument()
    expect(
      screen.queryByText('Mastered', { selector: '.feedback__mastered' }),
    ).toBeNull()
    expect(
      loadProgress().challenges[challengeKey('bug-hunt', 'ticket-total')],
    ).toMatchObject({
      solved: true,
      mastered: false,
    })
  })
})

describe('write modules and progression', () => {
  /** Saved Bug Hunt with the first `n` modules mastered. */
  function savedFirst(n: number) {
    let p = newProgress()
    bugHuntModules.slice(0, n).forEach(({ id }) => {
      p = applyAnswer(p, 'bug-hunt', id, true).progress
    })
    return p
  }

  it('Continue lands on an unfinished write module', () => {
    saveProgress(savedFirst(2))
    render(<App />)
    click('PLAY')
    click('Continue Bug Hunt')
    expectStep('Bug Hunt', 3, 7)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ticket Counter' }),
    ).toBeInTheDocument()
  })

  it('a solved write module persists, and replaying it pays no XP', () => {
    const { unmount } = render(<App />)
    click('PLAY')
    click('Play Bug Hunt')
    bugHuntModules.slice(0, 3).forEach((module) => {
      answerBugHunt(module, true)
      nextModule(false)
    })
    expectTotalXp(300)

    unmount()
    render(<App />)
    expectTotalXp(300)
    click('PLAY')
    expect(screen.getByText('Modules 03 / 07')).toBeInTheDocument()
    click('Replay Bug Hunt from the start')
    answerBugHunt(bugHuntModules[0], true)
    nextModule(false)
    answerBugHunt(bugHuntModules[1], true)
    nextModule(false)
    expect(
      screen.getByText('Mastered', { selector: '.game-hud__mark' }),
    ).toBeInTheDocument()
    writeCode(solution(ticketTotal))
    expect(screen.getByText('Replay · no XP')).toBeInTheDocument()
    expectTotalXp(300)
  })

  it('a game is only complete once its write modules are solved too', () => {
    // Every Bug Hunt patch solved, but neither write module.
    let p = newProgress()
    bugHuntModules
      .filter((m) => !('kind' in m))
      .forEach(({ id }) => {
        p = applyAnswer(p, 'bug-hunt', id, true).progress
      })
    saveProgress(p)
    render(<App />)
    click('PLAY')
    const card = screen
      .getByRole('heading', { name: 'Bug Hunt' })
      .closest('li')!
    expect(within(card).getByText('In progress')).toBeInTheDocument()
    expect(within(card).getByText('Modules 05 / 07')).toBeInTheDocument()
  })
})

describe('pointing players to write modules', () => {
  it('lessons say the linked game has modules where you type the code', () => {
    render(<App />)
    click('START LEARNING')
    click('Start Variables')
    expect(
      screen.getByText((_, el) =>
        el?.classList.contains('concept__write-note')
          ? el.textContent ===
            'Here you pick the answer. In Bug Hunt, Write modules have you type the code yourself.'
          : false,
      ),
    ).toBeInTheDocument()
  })

  it('cartridges say how many write modules each game has', () => {
    render(<App />)
    click('PLAY')
    for (const [name, count] of [
      ['Bug Hunt', 2],
      ['Code Breaker', 2],
      ['Data Sorter', 2],
      ['Function Forge', 3],
    ] as const) {
      const card = screen.getByRole('heading', { name }).closest('li')!
      expect(
        within(card).getByText(`${count} modules where you type the code`),
      ).toBeInTheDocument()
    }
  })
})
