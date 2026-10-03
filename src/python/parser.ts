import {
  KEYWORDS,
  PyError,
  tokenize,
  UNSUPPORTED,
  type Token,
} from './lexer.ts'

/* AST for CODEBOUND's Python subset. Every node keeps its source line. */

export type Expr =
  | { k: 'num'; value: number; int: boolean; line: number }
  | { k: 'str'; value: string; line: number }
  | { k: 'const'; value: boolean | null; line: number }
  | { k: 'name'; id: string; line: number }
  | { k: 'list'; items: Expr[]; line: number }
  | { k: 'bin'; op: string; left: Expr; right: Expr; line: number }
  | { k: 'cmp'; ops: string[]; operands: Expr[]; line: number }
  | { k: 'bool'; op: 'and' | 'or'; left: Expr; right: Expr; line: number }
  | { k: 'not'; operand: Expr; line: number }
  | { k: 'neg'; operand: Expr; line: number }
  | { k: 'call'; func: Expr; args: Expr[]; line: number }
  | { k: 'index'; target: Expr; index: Expr; line: number }
  | { k: 'attr'; target: Expr; name: string; line: number }

export type Stmt =
  | { k: 'expr'; expr: Expr; line: number }
  | { k: 'assign'; target: Expr; value: Expr; line: number }
  | { k: 'aug'; target: Expr; op: string; value: Expr; line: number }
  | {
      k: 'if'
      branches: { test: Expr; body: Stmt[] }[]
      orelse: Stmt[] | null
      line: number
    }
  | { k: 'for'; name: string; iter: Expr; body: Stmt[]; line: number }
  | { k: 'def'; name: string; params: string[]; body: Stmt[]; line: number }
  | { k: 'return'; value: Expr | null; line: number }
  | { k: 'pass'; line: number }

const COMPARE = new Set(['==', '!=', '<', '>', '<=', '>='])

/** Parses a whole program. Throws PyError on code outside the subset. */
export function parse(source: string): Stmt[] {
  if (source.includes('____')) {
    const line = source.split('\n').findIndex((l) => l.includes('____')) + 1
    throw new PyError(
      'SyntaxError',
      'Replace ____ with your own code first.',
      line,
    )
  }
  return new Parser(tokenize(source)).program()
}

/** Parses one expression, e.g. a test-case value like `[1, 2]` or `"Alex"`. */
export function parseExpression(source: string): Expr {
  const parser = new Parser(tokenize(source))
  const expr = parser.expression()
  parser.expectEndOfLine()
  return expr
}

class Parser {
  private pos = 0
  private readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private get tok(): Token {
    return this.tokens[this.pos]
  }

  private is(type: Token['type'], value?: string): boolean {
    const t = this.tok
    return t.type === type && (value === undefined || t.value === value)
  }

  private isOp(value: string) {
    return this.is('op', value)
  }

  private isWord(value: string) {
    return this.is('name', value)
  }

  private take(): Token {
    return this.tokens[this.pos++]
  }

  private fail(message: string, line = this.tok.line): never {
    throw new PyError('SyntaxError', message, line)
  }

  private expectOp(value: string, message?: string) {
    if (!this.isOp(value)) {
      this.fail(message ?? `Expected ${value} here.`)
    }
    this.take()
  }

  expectEndOfLine() {
    if (this.is('newline')) this.take()
    if (!this.is('end')) this.fail('Unexpected code after the value.')
  }

  program(): Stmt[] {
    const body: Stmt[] = []
    while (!this.is('end')) {
      if (this.is('indent')) {
        this.fail('This line is indented, but nothing above opens a block.')
      }
      body.push(this.statement())
    }
    return body
  }

  private statement(): Stmt {
    const t = this.tok
    if (t.type === 'name' && UNSUPPORTED.has(t.value)) {
      throw new PyError(
        'Unsupported',
        `\`${t.value}\` is not part of this terminal yet. Use what the lessons cover.`,
        t.line,
      )
    }
    if (this.isWord('if')) return this.ifStatement()
    if (this.isWord('for')) return this.forStatement()
    if (this.isWord('def')) return this.defStatement()
    if (this.isWord('elif') || this.isWord('else')) {
      this.fail(
        `\`${t.value}\` needs an \`if\` directly above it, at the same indent.`,
      )
    }
    const stmt = this.simpleStatement()
    this.endStatement()
    return stmt
  }

  private endStatement() {
    if (this.is('newline')) {
      this.take()
      return
    }
    if (this.is('end') || this.is('dedent')) return
    if (this.isOp('=')) {
      this.fail('Use == to compare. A single = stores a value.')
    }
    this.fail('Python did not expect this here. Check the line for a typo.')
  }

  private simpleStatement(): Stmt {
    const line = this.tok.line
    if (this.isWord('return')) {
      this.take()
      const value =
        this.is('newline') || this.is('end') || this.is('dedent')
          ? null
          : this.expression()
      return { k: 'return', value, line }
    }
    if (this.isWord('pass')) {
      this.take()
      return { k: 'pass', line }
    }

    const expr = this.expression()
    if (this.isOp('=')) {
      this.take()
      this.checkTarget(expr)
      return { k: 'assign', target: expr, value: this.expression(), line }
    }
    for (const op of ['+=', '-=', '*=']) {
      if (this.isOp(op)) {
        this.take()
        this.checkTarget(expr)
        return {
          k: 'aug',
          target: expr,
          op: op[0],
          value: this.expression(),
          line,
        }
      }
    }
    return { k: 'expr', expr, line }
  }

  private checkTarget(expr: Expr) {
    if (expr.k !== 'name' && expr.k !== 'index') {
      this.fail(
        'You can only store a value in a variable or a list item.',
        expr.line,
      )
    }
  }

  /** `:` then either an indented block or one statement on the same line. */
  private block(): Stmt[] {
    this.expectOp(':', 'This line needs a : at the end.')
    if (!this.is('newline')) {
      const stmt = this.simpleStatement()
      this.endStatement()
      return [stmt]
    }
    this.take()
    if (!this.is('indent')) {
      this.fail('The lines inside this block need to be indented.')
    }
    this.take()
    const body: Stmt[] = []
    while (!this.is('dedent') && !this.is('end')) body.push(this.statement())
    if (this.is('dedent')) this.take()
    return body
  }

  private condition(): Expr {
    const test = this.expression()
    if (this.isOp('=')) {
      this.fail('Use == to compare. A single = stores a value.')
    }
    return test
  }

  private ifStatement(): Stmt {
    const line = this.take().line
    const branches = [{ test: this.condition(), body: this.block() }]
    let orelse: Stmt[] | null = null
    while (this.isWord('elif')) {
      this.take()
      branches.push({ test: this.condition(), body: this.block() })
    }
    if (this.isWord('else')) {
      this.take()
      orelse = this.block()
    }
    return { k: 'if', branches, orelse, line }
  }

  private forStatement(): Stmt {
    const line = this.take().line
    if (!this.is('name') || KEYWORDS.has(this.tok.value)) {
      this.fail('A for loop needs a variable name: for item in ...')
    }
    const name = this.take().value
    if (!this.isWord('in')) this.fail('A for loop needs `in`: for item in ...')
    this.take()
    const iter = this.expression()
    return { k: 'for', name, iter, body: this.block(), line }
  }

  private defStatement(): Stmt {
    const line = this.take().line
    if (!this.is('name') || KEYWORDS.has(this.tok.value)) {
      this.fail('A function needs a name: def name():')
    }
    const name = this.take().value
    this.expectOp('(', 'A function name needs ( ) after it: def name():')
    const params: string[] = []
    while (!this.isOp(')')) {
      if (!this.is('name') || KEYWORDS.has(this.tok.value)) {
        this.fail('Parameters must be names, separated by commas.')
      }
      params.push(this.take().value)
      if (!this.isOp(',')) break
      this.take()
    }
    this.expectOp(')', 'This parameter list needs a closing ).')
    return { k: 'def', name, params, body: this.block(), line }
  }

  // ── Expressions, lowest precedence first ───────────────────────────────

  expression(): Expr {
    let left = this.andExpr()
    while (this.isWord('or')) {
      const line = this.take().line
      left = { k: 'bool', op: 'or', left, right: this.andExpr(), line }
    }
    return left
  }

  private andExpr(): Expr {
    let left = this.notExpr()
    while (this.isWord('and')) {
      const line = this.take().line
      left = { k: 'bool', op: 'and', left, right: this.notExpr(), line }
    }
    return left
  }

  private notExpr(): Expr {
    if (this.isWord('not')) {
      const line = this.take().line
      return { k: 'not', operand: this.notExpr(), line }
    }
    return this.comparison()
  }

  private comparison(): Expr {
    const first = this.sum()
    const ops: string[] = []
    const operands = [first]
    while (this.is('op') && COMPARE.has(this.tok.value)) {
      ops.push(this.take().value)
      operands.push(this.sum())
    }
    return ops.length ? { k: 'cmp', ops, operands, line: first.line } : first
  }

  private sum(): Expr {
    let left = this.term()
    while (this.isOp('+') || this.isOp('-')) {
      const { value: op, line } = this.take()
      left = { k: 'bin', op, left, right: this.term(), line }
    }
    return left
  }

  private term(): Expr {
    let left = this.factor()
    while (['*', '/', '//', '%'].some((op) => this.isOp(op))) {
      const { value: op, line } = this.take()
      left = { k: 'bin', op, left, right: this.factor(), line }
    }
    return left
  }

  private factor(): Expr {
    if (this.isOp('-')) {
      const line = this.take().line
      return { k: 'neg', operand: this.factor(), line }
    }
    const base = this.postfix()
    if (this.isOp('**')) {
      const line = this.take().line
      return { k: 'bin', op: '**', left: base, right: this.factor(), line }
    }
    return base
  }

  private postfix(): Expr {
    let expr = this.atom()
    for (;;) {
      const line = this.tok.line
      if (this.isOp('(')) {
        this.take()
        const args: Expr[] = []
        while (!this.isOp(')')) {
          args.push(this.expression())
          if (!this.isOp(',')) break
          this.take()
        }
        this.expectOp(')', 'This call needs a closing ).')
        expr = { k: 'call', func: expr, args, line }
      } else if (this.isOp('[')) {
        this.take()
        const index = this.expression()
        this.expectOp(']', 'This index needs a closing ].')
        expr = { k: 'index', target: expr, index, line }
      } else if (this.isOp('.')) {
        this.take()
        if (!this.is('name')) this.fail('Expected a method name after the dot.')
        expr = { k: 'attr', target: expr, name: this.take().value, line }
      } else {
        return expr
      }
    }
  }

  private atom(): Expr {
    const t = this.tok
    if (t.type === 'number') {
      this.take()
      return {
        k: 'num',
        value: Number(t.value),
        int: !t.value.includes('.'),
        line: t.line,
      }
    }
    if (t.type === 'string') {
      this.take()
      return { k: 'str', value: t.value, line: t.line }
    }
    if (t.type === 'name') {
      if (t.value === 'True' || t.value === 'False' || t.value === 'None') {
        this.take()
        const value = t.value === 'None' ? null : t.value === 'True'
        return { k: 'const', value, line: t.line }
      }
      if (UNSUPPORTED.has(t.value)) {
        throw new PyError(
          'Unsupported',
          `\`${t.value}\` is not part of this terminal yet. Use what the lessons cover.`,
          t.line,
        )
      }
      if (KEYWORDS.has(t.value)) {
        this.fail(`\`${t.value}\` cannot be used here.`)
      }
      this.take()
      return { k: 'name', id: t.value, line: t.line }
    }
    if (this.isOp('[')) {
      this.take()
      const items: Expr[] = []
      while (!this.isOp(']')) {
        items.push(this.expression())
        if (!this.isOp(',')) break
        this.take()
      }
      this.expectOp(']', 'This list needs a closing ].')
      return { k: 'list', items, line: t.line }
    }
    if (this.isOp('(')) {
      this.take()
      const inner = this.expression()
      this.expectOp(')', 'This bracket needs a closing ).')
      return inner
    }
    if (t.type === 'newline' || t.type === 'end') {
      this.fail('This line ends too early. Something is missing.')
    }
    if (t.type === 'indent') this.fail('This line is indented too far.')
    this.fail(`Python did not expect ${t.value || 'this'} here.`)
  }
}
