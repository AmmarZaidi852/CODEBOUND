import {
  equal,
  literal,
  repr,
  runProgram,
  type Value,
} from '../python/interpreter.ts'
import { PyError, tokenize, type Token } from '../python/lexer.ts'

/*
 * "Write" challenges: the player edits real Python and presses Check.
 * The code runs in CODEBOUND's controlled simulator (src/python) against
 * the challenge's test cases. User code is never executed as JavaScript
 * or by a real Python runtime.
 */

/** One run of the player's code and what it must produce. */
export interface CodeTest {
  /** Variables the system sets before the code runs (Python literals). */
  given?: Record<string, string>
  /** Exact printed lines. */
  output?: string[]
  /** Variable values after the run (Python literals). */
  vars?: Record<string, string>
  /** Function calls made after the run, and what they must return. */
  calls?: { fn: string; args: string[]; returns: string }[]
}

/**
 * Code the solution must (or must not) contain, as Python token sequences.
 * `uses` passes when any of the listed alternatives appears.
 */
export type CodeRequirement =
  | { uses: string | string[]; message: string }
  | { avoids: string; message: string }

/** What a failed test looked like, for diagnosing the mistake. */
export interface CodeFailure {
  test: CodeTest
  /** Printed lines from that run. */
  output: string[]
  error: PyError | null
  /** Variables after that run. */
  globals: Map<string, Value>
  source: string
  tokens: string[]
  /** Set when a function call returned the wrong value. */
  callMessage?: string
}

export interface CodeChallenge {
  kind: 'code'
  id: string
  title: string
  concept: string
  /** Short concept primer. Backticks mark inline code. */
  lesson: string
  /** What to do. Backticks mark inline code. */
  mission: string
  /** What the finished program does, e.g. "Prints 24". Backticks mark code. */
  goal: string
  /** Only when needed, e.g. "Use append()". */
  constraint?: string
  starter: string[]
  /** System values shown as a readout (Code Breaker). Uses the first test's `given`. */
  showGiven?: boolean
  /** List variable drawn as cells before and after (Data Sorter). */
  listVariable?: string
  tests: CodeTest[]
  requirements?: CodeRequirement[]
  /** Specific diagnoses, checked in order before the generic message. */
  mistakes?: { when: (f: CodeFailure) => boolean; message: string }[]
  /** Three hints, each revealing more. Never the full answer. */
  hints: [string, string, string]
  /** A correct solution, shown after it is solved or revealed. */
  solution: string[]
  explanation: { steps: string; concept: string }
}

export interface CodeVerdict {
  correct: boolean
  /** What the checker found, in plain words. Backticks mark code. */
  message: string
  /** Printed lines from the run shown to the player. */
  output: string[]
  /** "Line 2 · NameError: ..." when the code stopped with an error. */
  error: string | null
  /** The list variable after the run, if the challenge draws one. */
  list: number[] | null
}

export function isCodeChallenge(challenge: object): challenge is CodeChallenge {
  return (challenge as CodeChallenge).kind === 'code'
}

const given = (test: CodeTest): Record<string, Value> =>
  Object.fromEntries(
    Object.entries(test.given ?? {}).map(([name, v]) => [name, literal(v)]),
  )

function tokenValues(source: string, partial = false): string[] | null {
  try {
    return tokenize(source, partial)
      .filter((t: Token) => t.type !== 'newline' && t.type !== 'indent')
      .filter((t) => t.type !== 'dedent' && t.type !== 'end')
      .map((t) => (t.type === 'string' ? JSON.stringify(t.value) : t.value))
  } catch {
    return null
  }
}

/** True when `pattern`'s tokens appear, in order and adjacent, in `tokens`. */
export function containsTokens(tokens: string[], pattern: string): boolean {
  const want = tokenValues(pattern, true) ?? []
  if (want.length === 0) return false
  return tokens.some((_, i) => want.every((w, j) => tokens[i + j] === w))
}

function describeGiven(test: CodeTest): string {
  const entries = Object.entries(test.given ?? {})
  return entries.map(([name, v]) => `${name} = ${v}`).join(', ')
}

const quote = (lines: string[]) =>
  lines.length === 0
    ? 'nothing'
    : lines.length === 1
      ? `\`${lines[0]}\``
      : lines.map((l) => `\`${l}\``).join(' / ')

/** Plain-words description of a failed test. */
function describeFailure(f: CodeFailure): string {
  const when = f.test.given ? `When ${describeGiven(f.test)}, your` : 'Your'
  if (f.error) {
    return `${when} code stopped with an error: ${f.error.message}.`
  }
  if (f.test.output && !sameLines(f.output, f.test.output)) {
    return f.output.length === 0
      ? `${when} code did not print anything. It should print ${quote(f.test.output)}.`
      : `${when} code printed ${quote(f.output)}. It should print ${quote(f.test.output)}.`
  }
  for (const [name, want] of Object.entries(f.test.vars ?? {})) {
    const got = f.globals.get(name)
    if (!got) return `There is no variable named \`${name}\` at the end.`
    if (!equal(got, literal(want))) {
      return `At the end, \`${name}\` is \`${repr(got)}\`. It should be \`${repr(literal(want))}\`.`
    }
  }
  return 'Your code does not do what the goal asks yet.'
}

function sameLines(a: string[], b: string[]) {
  return a.length === b.length && a.every((line, i) => line === b[i])
}

/** Runs one test. Returns the failure, or null when it passes. */
function runTest(
  source: string,
  tokens: string[],
  test: CodeTest,
): {
  failure: CodeFailure | null
  output: string[]
  globals: Map<string, Value>
} {
  const result = runProgram(source, given(test))
  const fail = (extra: Partial<CodeFailure> = {}) => ({
    failure: {
      test,
      output: result.output,
      error: result.error,
      globals: result.globals,
      source,
      tokens,
      ...extra,
    },
    output: result.output,
    globals: result.globals,
  })

  if (result.error) return fail()
  if (test.output && !sameLines(result.output, test.output)) return fail()
  for (const [name, want] of Object.entries(test.vars ?? {})) {
    const got = result.globals.get(name)
    if (!got || !equal(got, literal(want))) return fail()
  }
  for (const call of test.calls ?? []) {
    const label = `${call.fn}(${call.args.join(', ')})`
    const def = result.globals.get(call.fn)
    if (!def || def.t !== 'func') {
      return fail({
        error: new PyError(
          'NameError',
          `there is no function named ${call.fn}. Define it with def ${call.fn}(...):`,
        ),
      })
    }
    const ran = result.call(call.fn, call.args.map(literal))
    if (ran.error) {
      return fail({
        error: new PyError(ran.error.kind, `${label}: ${ran.error.message}`),
      })
    }
    const want = literal(call.returns)
    if (!equal(ran.value!, want)) {
      const got = repr(ran.value!)
      const message =
        ran.value!.t === 'none' && ran.output.length > 0
          ? `\`${label}\` printed \`${ran.output.join(' ')}\` but returned \`None\`. Use \`return\` to send the value back.`
          : ran.value!.t === 'none'
            ? `\`${label}\` returned \`None\`. The function is missing a \`return\` statement.`
            : `\`${label}\` returned \`${got}\`. It should return \`${repr(want)}\`.`
      return {
        failure: {
          test,
          output: ran.output,
          error: null,
          globals: result.globals,
          source,
          tokens,
          callMessage: message,
        },
        output: result.output,
        globals: result.globals,
      }
    }
  }
  return { failure: null, output: result.output, globals: result.globals }
}

function listValues(value: Value | undefined): number[] | null {
  if (!value || value.t !== 'list') return null
  const nums = value.items.map((item) => (item.t === 'int' ? item.v : NaN))
  return nums.every((n) => !Number.isNaN(n)) ? nums : null
}

/** Checks the player's code against the challenge. Never throws. */
export function checkCode(
  challenge: CodeChallenge,
  source: string,
): CodeVerdict {
  const tokens = tokenValues(source) ?? []
  let shown: { output: string[]; globals: Map<string, Value> } | null = null

  for (const test of challenge.tests) {
    const { failure, output, globals } = runTest(source, tokens, test)
    shown ??= { output, globals }
    if (failure) {
      const mistake = challenge.mistakes?.find((m) => {
        try {
          return m.when(failure)
        } catch {
          return false
        }
      })
      return {
        correct: false,
        message:
          mistake?.message ?? failure.callMessage ?? describeFailure(failure),
        output: failure.output,
        error: failure.error
          ? `${failure.error.line ? `Line ${failure.error.line} · ` : ''}${failure.error.kind}: ${failure.error.message}`
          : null,
        list: listValues(
          challenge.listVariable
            ? failure.globals.get(challenge.listVariable)
            : undefined,
        ),
      }
    }
  }

  const missing = challenge.requirements?.find((r) =>
    'uses' in r
      ? ![r.uses].flat().some((p) => containsTokens(tokens, p))
      : containsTokens(tokens, r.avoids),
  )
  const list = listValues(
    challenge.listVariable
      ? shown?.globals.get(challenge.listVariable)
      : undefined,
  )
  if (missing) {
    return {
      correct: false,
      message: missing.message,
      output: shown?.output ?? [],
      error: null,
      list,
    }
  }
  return {
    correct: true,
    message: 'Every check passed.',
    output: shown?.output ?? [],
    error: null,
    list,
  }
}

/** A variable's value after a failed run, as Python would show it. */
export function valueOf(f: CodeFailure, name: string): string | null {
  const value = f.globals.get(name)
  return value ? repr(value) : null
}

/** The code the player starts with, as one editable string. */
export const starterSource = (challenge: CodeChallenge) =>
  challenge.starter.join('\n')
