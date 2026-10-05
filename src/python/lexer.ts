/*
 * Tokenizer for CODEBOUND's small Python subset. Produces INDENT / DEDENT /
 * NEWLINE tokens like Python's own tokenizer, so blocks are real indentation.
 */

export type TokenType =
  'name' | 'number' | 'string' | 'op' | 'newline' | 'indent' | 'dedent' | 'end'

export interface Token {
  type: TokenType
  value: string
  line: number
}

/** A problem with the player's code, reported like Python would. */
export class PyError extends Error {
  readonly kind: string
  readonly line: number | null

  constructor(kind: string, message: string, line: number | null = null) {
    super(message)
    this.kind = kind
    this.line = line
  }
}

export const KEYWORDS = new Set([
  'if',
  'elif',
  'else',
  'for',
  'while',
  'in',
  'def',
  'return',
  'and',
  'or',
  'not',
  'True',
  'False',
  'None',
  'pass',
])

/** Real Python keywords this terminal does not run. */
export const UNSUPPORTED = new Set([
  'import',
  'from',
  'class',
  'lambda',
  'try',
  'except',
  'with',
  'global',
  'nonlocal',
  'yield',
  'async',
  'await',
  'break',
  'continue',
  'del',
  'assert',
  'raise',
  'is',
])

// Longest first, so ">=" wins over ">".
const OPERATORS = [
  '**',
  '//',
  '==',
  '!=',
  '<=',
  '>=',
  '+=',
  '-=',
  '*=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '=',
  '(',
  ')',
  '[',
  ']',
  ',',
  ':',
  '.',
]

/** `partial` allows unclosed brackets, for matching code fragments. */
export function tokenize(source: string, partial = false): Token[] {
  const tokens: Token[] = []
  const indents = [0]
  let depth = 0 // open brackets: newlines inside them are ignored

  source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((text, i) => {
      const line = i + 1
      if (text.includes('\t')) {
        throw new PyError(
          'SyntaxError',
          'Use spaces for indentation, not tabs.',
          line,
        )
      }
      const body = stripComment(text)
      if (body.trim() === '') return

      if (depth === 0) {
        const indent = body.length - body.trimStart().length
        if (indent > indents[indents.length - 1]) {
          indents.push(indent)
          tokens.push({ type: 'indent', value: '', line })
        }
        while (indent < indents[indents.length - 1]) {
          indents.pop()
          tokens.push({ type: 'dedent', value: '', line })
        }
        if (indent !== indents[indents.length - 1]) {
          throw new PyError(
            'IndentationError',
            'This line does not line up with any block above it.',
            line,
          )
        }
      }

      let pos = body.length - body.trimStart().length
      while (pos < body.length) {
        const ch = body[pos]
        if (ch === ' ') {
          pos++
          continue
        }
        const rest = body.slice(pos)

        const number = /^\d+(\.\d+)?/.exec(rest)
        if (number) {
          tokens.push({ type: 'number', value: number[0], line })
          pos += number[0].length
          continue
        }

        const name = /^[A-Za-z_]\w*/.exec(rest)
        if (name) {
          // f"..." and similar string prefixes.
          if (/^[fFrRbB]$/.test(name[0]) && /^["']/.test(rest.slice(1))) {
            throw new PyError(
              'Unsupported',
              'f-strings are not covered yet. Join text with + and str() instead.',
              line,
            )
          }
          tokens.push({ type: 'name', value: name[0], line })
          pos += name[0].length
          continue
        }

        if (ch === '"' || ch === "'") {
          const end = body.indexOf(ch, pos + 1)
          if (end === -1) {
            throw new PyError(
              'SyntaxError',
              'This text is missing its closing quote.',
              line,
            )
          }
          tokens.push({ type: 'string', value: body.slice(pos + 1, end), line })
          pos = end + 1
          continue
        }

        const op = OPERATORS.find((o) => rest.startsWith(o))
        if (!op) {
          throw new PyError(
            'SyntaxError',
            `Python cannot read the character ${ch}`,
            line,
          )
        }
        if (op === '(' || op === '[') depth++
        if (op === ')' || op === ']') depth = Math.max(0, depth - 1)
        tokens.push({ type: 'op', value: op, line })
        pos += op.length
      }

      if (depth === 0) tokens.push({ type: 'newline', value: '', line })
    })

  const last = tokens.at(-1)?.line ?? 1
  if (depth > 0 && !partial) {
    throw new PyError('SyntaxError', 'A bracket is never closed.', last)
  }
  while (indents.length > 1) {
    indents.pop()
    tokens.push({ type: 'dedent', value: '', line: last })
  }
  tokens.push({ type: 'end', value: '', line: last })
  return tokens
}

/** Removes a # comment, ignoring # inside quotes. */
function stripComment(text: string): string {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '#') {
      return text.slice(0, i).trimEnd()
    }
  }
  return text.trimEnd()
}
