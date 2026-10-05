import { PyError } from './lexer.ts'
import { parse, parseExpression, type Expr, type Stmt } from './parser.ts'

/*
 * A small, deterministic simulator for CODEBOUND's Python subset.
 * It never calls eval, has no access to the page, and stops after a fixed
 * number of steps. It is NOT a Python implementation: anything outside the
 * subset is reported as unsupported.
 */

export type Value =
  | { t: 'int'; v: number }
  | { t: 'float'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'none' }
  | { t: 'list'; items: Value[] }
  | { t: 'func'; name: string; params: string[]; body: Stmt[] }
  | { t: 'builtin'; name: string }
  | { t: 'method'; name: string; self: Value }

const NONE: Value = { t: 'none' }
const MAX_STEPS = 20_000
const MAX_RANGE = 1_000
const MAX_DEPTH = 50

const BUILTINS = ['print', 'len', 'range', 'str', 'int']

/** Timeouts already blamed on a specific `while` loop. */
const explained = new WeakSet<PyError>()

/** The step limit hit inside a `while`: name its condition and variables. */
function endlessLoop(stmt: Extract<Stmt, { k: 'while' }>): PyError {
  const names = stmt.names.map((n) => `\`${n}\``)
  const hint = names.length
    ? ` Does the loop change ${names.join(' or ')}?`
    : ' Nothing inside the loop can change it.'
  const error = new PyError(
    'Timeout',
    `\`while ${stmt.source}\` never became False.${hint}`,
    stmt.line,
  )
  explained.add(error)
  return error
}

export const int = (v: number): Value => ({ t: 'int', v })
export const str = (v: string): Value => ({ t: 'str', v })
export const list = (items: Value[]): Value => ({ t: 'list', items })

class Return {
  readonly value: Value
  constructor(value: Value) {
    this.value = value
  }
}

export interface RunResult {
  /** Printed lines, in order. */
  output: string[]
  /** The first error, which stopped the program (output before it is kept). */
  error: PyError | null
  /** Variables at the end of the program. */
  globals: Map<string, Value>
}

export interface CallResult {
  value: Value | null
  output: string[]
  error: PyError | null
}

// ── Formatting, like Python's str() and repr() ───────────────────────────

export function typeName(value: Value): string {
  const names: Record<Value['t'], string> = {
    int: 'int',
    float: 'float',
    str: 'str',
    bool: 'bool',
    none: 'NoneType',
    list: 'list',
    func: 'function',
    builtin: 'builtin_function_or_method',
    method: 'method',
  }
  return names[value.t]
}

function formatFloat(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : v < 0 ? '-inf' : 'nan'
  return Number.isInteger(v) ? v.toFixed(1) : String(v)
}

export function repr(value: Value): string {
  switch (value.t) {
    case 'str':
      return value.v.includes("'") && !value.v.includes('"')
        ? `"${value.v}"`
        : `'${value.v.replaceAll("'", "\\'")}'`
    case 'list':
      return `[${value.items.map(repr).join(', ')}]`
    default:
      return toStr(value)
  }
}

export function toStr(value: Value): string {
  switch (value.t) {
    case 'int':
      return String(value.v)
    case 'float':
      return formatFloat(value.v)
    case 'str':
      return value.v
    case 'bool':
      return value.v ? 'True' : 'False'
    case 'none':
      return 'None'
    case 'list':
      return repr(value)
    case 'func':
      return `<function ${value.name}>`
    case 'builtin':
      return `<built-in function ${value.name}>`
    case 'method':
      return `<method ${value.name}>`
  }
}

export function equal(a: Value, b: Value): boolean {
  if (isNumber(a) && isNumber(b)) return num(a) === num(b)
  if (a.t === 'str' && b.t === 'str') return a.v === b.v
  if (a.t === 'none' && b.t === 'none') return true
  if (a.t === 'list' && b.t === 'list') {
    return (
      a.items.length === b.items.length &&
      a.items.every((item, i) => equal(item, b.items[i]))
    )
  }
  return a === b
}

const isNumber = (v: Value) =>
  v.t === 'int' || v.t === 'float' || v.t === 'bool'
const isInt = (v: Value) => v.t === 'int' || v.t === 'bool'
const num = (v: Value) =>
  v.t === 'bool' ? (v.v ? 1 : 0) : (v as { v: number }).v

function truthy(value: Value): boolean {
  switch (value.t) {
    case 'int':
    case 'float':
      return value.v !== 0
    case 'bool':
      return value.v
    case 'str':
      return value.v !== ''
    case 'none':
      return false
    case 'list':
      return value.items.length > 0
    default:
      return true
  }
}

// ── Interpreter ──────────────────────────────────────────────────────────

class Interpreter {
  readonly globals = new Map<string, Value>()
  readonly output: string[] = []
  private steps = 0
  private depth = 0

  constructor(given: Record<string, Value> = {}) {
    for (const [name, value] of Object.entries(given)) {
      this.globals.set(name, value)
    }
  }

  private tick(line: number) {
    if (++this.steps > MAX_STEPS) {
      throw new PyError(
        'Timeout',
        'The program ran too long. Check that every loop ends.',
        line,
      )
    }
  }

  run(body: Stmt[], scope: Map<string, Value>) {
    for (const stmt of body) this.exec(stmt, scope)
  }

  private exec(stmt: Stmt, scope: Map<string, Value>) {
    this.tick(stmt.line)
    switch (stmt.k) {
      case 'expr':
        this.eval(stmt.expr, scope)
        return
      case 'assign':
        this.store(stmt.target, this.eval(stmt.value, scope), scope)
        return
      case 'aug': {
        const current = this.eval(stmt.target, scope)
        const value = this.binary(
          stmt.op,
          current,
          this.eval(stmt.value, scope),
          stmt.line,
        )
        this.store(stmt.target, value, scope)
        return
      }
      case 'if':
        for (const branch of stmt.branches) {
          if (truthy(this.eval(branch.test, scope))) {
            this.run(branch.body, scope)
            return
          }
        }
        if (stmt.orelse) this.run(stmt.orelse, scope)
        return
      case 'for': {
        const items = this.iterate(this.eval(stmt.iter, scope), stmt.line)
        for (const item of items) {
          this.tick(stmt.line)
          scope.set(stmt.name, item)
          this.run(stmt.body, scope)
        }
        return
      }
      case 'while':
        try {
          while (truthy(this.eval(stmt.test, scope))) {
            this.tick(stmt.line)
            this.run(stmt.body, scope)
          }
        } catch (e) {
          // The innermost endless loop names its own condition.
          if (
            e instanceof PyError &&
            e.kind === 'Timeout' &&
            !explained.has(e)
          ) {
            throw endlessLoop(stmt)
          }
          throw e
        }
        return
      case 'def':
        scope.set(stmt.name, {
          t: 'func',
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
        })
        return
      case 'return':
        if (scope === this.globals) {
          throw new PyError(
            'SyntaxError',
            '`return` can only be used inside a function.',
            stmt.line,
          )
        }
        throw new Return(stmt.value ? this.eval(stmt.value, scope) : NONE)
      case 'pass':
        return
    }
  }

  private store(target: Expr, value: Value, scope: Map<string, Value>) {
    if (target.k === 'name') {
      scope.set(target.id, value)
      return
    }
    if (target.k === 'index') {
      const container = this.eval(target.target, scope)
      if (container.t !== 'list') {
        throw new PyError(
          'TypeError',
          `'${typeName(container)}' object does not support item assignment`,
          target.line,
        )
      }
      const i = this.position(
        container.items.length,
        this.eval(target.index, scope),
        target.line,
        'list assignment index out of range',
      )
      container.items[i] = value
    }
  }

  private iterate(value: Value, line: number): Value[] {
    if (value.t === 'list') return [...value.items]
    if (value.t === 'str') return [...value.v].map(str)
    throw new PyError(
      'TypeError',
      `'${typeName(value)}' object is not iterable`,
      line,
    )
  }

  private lookup(id: string, scope: Map<string, Value>, line: number): Value {
    const value = scope.get(id) ?? this.globals.get(id)
    if (value) return value
    if (BUILTINS.includes(id)) return { t: 'builtin', name: id }
    throw new PyError('NameError', `name '${id}' is not defined`, line)
  }

  eval(expr: Expr, scope: Map<string, Value>): Value {
    this.tick(expr.line)
    switch (expr.k) {
      case 'num':
        return expr.int ? int(expr.value) : { t: 'float', v: expr.value }
      case 'str':
        return str(expr.value)
      case 'const':
        return expr.value === null ? NONE : { t: 'bool', v: expr.value }
      case 'name':
        return this.lookup(expr.id, scope, expr.line)
      case 'list':
        return list(expr.items.map((item) => this.eval(item, scope)))
      case 'bin':
        return this.binary(
          expr.op,
          this.eval(expr.left, scope),
          this.eval(expr.right, scope),
          expr.line,
        )
      case 'neg': {
        const v = this.eval(expr.operand, scope)
        if (!isNumber(v)) {
          throw new PyError(
            'TypeError',
            `bad operand type for unary -: '${typeName(v)}'`,
            expr.line,
          )
        }
        return isInt(v) ? int(-num(v)) : { t: 'float', v: -num(v) }
      }
      case 'not':
        return { t: 'bool', v: !truthy(this.eval(expr.operand, scope)) }
      case 'bool': {
        const left = this.eval(expr.left, scope)
        if (expr.op === 'and') {
          return truthy(left) ? this.eval(expr.right, scope) : left
        }
        return truthy(left) ? left : this.eval(expr.right, scope)
      }
      case 'cmp': {
        let left = this.eval(expr.operands[0], scope)
        for (let i = 0; i < expr.ops.length; i++) {
          const right = this.eval(expr.operands[i + 1], scope)
          if (!this.compare(expr.ops[i], left, right, expr.line)) {
            return { t: 'bool', v: false }
          }
          left = right
        }
        return { t: 'bool', v: true }
      }
      case 'index': {
        const target = this.eval(expr.target, scope)
        const index = this.eval(expr.index, scope)
        if (target.t === 'list') {
          return target.items[
            this.position(
              target.items.length,
              index,
              expr.line,
              'list index out of range',
            )
          ]
        }
        if (target.t === 'str') {
          return str(
            target.v[
              this.position(
                target.v.length,
                index,
                expr.line,
                'string index out of range',
              )
            ],
          )
        }
        throw new PyError(
          'TypeError',
          `'${typeName(target)}' object is not subscriptable`,
          expr.line,
        )
      }
      case 'attr': {
        const target = this.eval(expr.target, scope)
        if (target.t === 'list' && ['append', 'pop'].includes(expr.name)) {
          return { t: 'method', name: expr.name, self: target }
        }
        throw new PyError(
          'AttributeError',
          `'${typeName(target)}' object has no attribute '${expr.name}'`,
          expr.line,
        )
      }
      case 'call': {
        const func = this.eval(expr.func, scope)
        const args = expr.args.map((arg) => this.eval(arg, scope))
        return this.call(func, args, expr.line)
      }
    }
  }

  /** A list position from a Python index, allowing negatives. */
  private position(
    length: number,
    index: Value,
    line: number,
    outOfRange: string,
  ): number {
    if (!isInt(index)) {
      throw new PyError(
        'TypeError',
        `indices must be integers, not ${typeName(index)}`,
        line,
      )
    }
    const i = num(index) < 0 ? length + num(index) : num(index)
    if (i < 0 || i >= length) throw new PyError('IndexError', outOfRange, line)
    return i
  }

  call(func: Value, args: Value[], line: number): Value {
    if (func.t === 'builtin') return this.builtin(func.name, args, line)
    if (func.t === 'method') return this.method(func, args, line)
    if (func.t !== 'func') {
      throw new PyError(
        'TypeError',
        `'${typeName(func)}' object is not callable`,
        line,
      )
    }
    if (args.length !== func.params.length) {
      const missing = func.params.slice(args.length)
      throw new PyError(
        'TypeError',
        args.length < func.params.length
          ? `${func.name}() missing ${missing.length} required argument${missing.length > 1 ? 's' : ''}: ${missing.map((p) => `'${p}'`).join(', ')}`
          : `${func.name}() takes ${func.params.length} argument${func.params.length === 1 ? '' : 's'} but ${args.length} were given`,
        line,
      )
    }
    if (++this.depth > MAX_DEPTH) {
      throw new PyError('RecursionError', 'Too many nested calls.', line)
    }
    const locals = new Map<string, Value>()
    func.params.forEach((param, i) => locals.set(param, args[i]))
    try {
      this.run(func.body, locals)
      return NONE
    } catch (signal) {
      if (signal instanceof Return) return signal.value
      throw signal
    } finally {
      this.depth--
    }
  }

  private builtin(name: string, args: Value[], line: number): Value {
    const arity = (min: number, max = min) => {
      if (args.length < min || args.length > max) {
        throw new PyError(
          'TypeError',
          `${name}() takes ${min === max ? min : `${min} to ${max}`} argument${max === 1 ? '' : 's'} (${args.length} given)`,
          line,
        )
      }
    }
    switch (name) {
      case 'print':
        this.output.push(args.map(toStr).join(' '))
        return NONE
      case 'len': {
        arity(1)
        const [v] = args
        if (v.t === 'list') return int(v.items.length)
        if (v.t === 'str') return int(v.v.length)
        throw new PyError(
          'TypeError',
          `object of type '${typeName(v)}' has no len()`,
          line,
        )
      }
      case 'str':
        arity(1)
        return str(toStr(args[0]))
      case 'int': {
        arity(1)
        const [v] = args
        if (isNumber(v)) return int(Math.trunc(num(v)))
        if (v.t === 'str' && /^\s*-?\d+\s*$/.test(v.v)) return int(Number(v.v))
        throw new PyError(
          'ValueError',
          `invalid literal for int(): ${repr(v)}`,
          line,
        )
      }
      case 'range': {
        arity(1, 3)
        if (!args.every(isInt)) {
          throw new PyError('TypeError', 'range() needs whole numbers', line)
        }
        const [start, stop, step] =
          args.length === 1
            ? [0, num(args[0]), 1]
            : [num(args[0]), num(args[1]), args[2] ? num(args[2]) : 1]
        if (step === 0) {
          throw new PyError('ValueError', 'range() step must not be zero', line)
        }
        const items: Value[] = []
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
          if (items.length >= MAX_RANGE) {
            throw new PyError(
              'Timeout',
              `This terminal counts to ${MAX_RANGE} at most.`,
              line,
            )
          }
          items.push(int(i))
        }
        return list(items)
      }
    }
    throw new PyError('NameError', `name '${name}' is not defined`, line)
  }

  private method(
    m: Extract<Value, { t: 'method' }>,
    args: Value[],
    line: number,
  ) {
    const self = m.self as Extract<Value, { t: 'list' }>
    if (m.name === 'append') {
      if (args.length !== 1) {
        throw new PyError(
          'TypeError',
          `list.append() takes exactly one argument (${args.length} given)`,
          line,
        )
      }
      self.items.push(args[0])
      return NONE
    }
    // pop
    if (args.length > 1) {
      throw new PyError('TypeError', 'pop expected at most 1 argument', line)
    }
    if (self.items.length === 0) {
      throw new PyError('IndexError', 'pop from empty list', line)
    }
    const i = args.length
      ? this.position(
          self.items.length,
          args[0],
          line,
          'pop index out of range',
        )
      : self.items.length - 1
    return self.items.splice(i, 1)[0]
  }

  private compare(op: string, a: Value, b: Value, line: number): boolean {
    if (op === '==') return equal(a, b)
    if (op === '!=') return !equal(a, b)
    let x: number | string
    let y: number | string
    if (isNumber(a) && isNumber(b)) {
      x = num(a)
      y = num(b)
    } else if (a.t === 'str' && b.t === 'str') {
      x = a.v
      y = b.v
    } else {
      throw new PyError(
        'TypeError',
        `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`,
        line,
      )
    }
    if (op === '<') return x < y
    if (op === '>') return x > y
    if (op === '<=') return x <= y
    return x >= y
  }

  binary(op: string, a: Value, b: Value, line: number): Value {
    if (op === '+') {
      if (a.t === 'str' && b.t === 'str') return str(a.v + b.v)
      if (a.t === 'list' && b.t === 'list')
        return list([...a.items, ...b.items])
      if (a.t === 'str') {
        throw new PyError(
          'TypeError',
          `can only concatenate str (not "${typeName(b)}") to str`,
          line,
        )
      }
    }
    if (op === '*') {
      const text = a.t === 'str' ? a : b.t === 'str' ? b : null
      const times = text === a ? b : a
      if (text && text.t === 'str' && isInt(times)) {
        return str(text.v.repeat(Math.max(0, num(times))))
      }
    }
    if (!isNumber(a) || !isNumber(b)) {
      throw new PyError(
        'TypeError',
        `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`,
        line,
      )
    }
    const x = num(a)
    const y = num(b)
    const ints = isInt(a) && isInt(b)
    const result = (v: number, asInt = ints): Value =>
      asInt ? int(v) : { t: 'float', v }
    if ((op === '/' || op === '//' || op === '%') && y === 0) {
      throw new PyError('ZeroDivisionError', 'division by zero', line)
    }
    switch (op) {
      case '+':
        return result(x + y)
      case '-':
        return result(x - y)
      case '*':
        return result(x * y)
      case '/':
        return result(x / y, false)
      case '//':
        return result(Math.floor(x / y))
      case '%':
        return result(((x % y) + y) % y)
      case '**':
        return result(x ** y, ints && y >= 0)
    }
    throw new PyError('SyntaxError', `Unknown operator ${op}`, line)
  }
}

function asPyError(error: unknown): PyError {
  if (error instanceof PyError) return error
  if (error instanceof Return) {
    return new PyError(
      'SyntaxError',
      '`return` can only be used inside a function.',
    )
  }
  // A bug in the simulator itself must never crash the page.
  return new PyError('InternalError', 'The terminal could not run this code.')
}

/**
 * Runs a program. `given` pre-defines variables (a challenge's system
 * state). Never throws: errors come back in the result.
 */
export function runProgram(
  source: string,
  given: Record<string, Value> = {},
): RunResult & { call: (name: string, args: Value[]) => CallResult } {
  const interp = new Interpreter(given)
  let error: PyError | null = null
  try {
    interp.run(parse(source), interp.globals)
  } catch (e) {
    error = asPyError(e)
  }
  return {
    output: interp.output,
    error,
    globals: interp.globals,
    /** Calls a function the program defined, capturing what it prints. */
    call(name, args) {
      const start = interp.output.length
      try {
        const func = interp.globals.get(name)
        if (!func || func.t !== 'func') {
          throw new PyError('NameError', `name '${name}' is not defined`)
        }
        const value = interp.call(func, args, 0)
        return { value, output: interp.output.slice(start), error: null }
      } catch (e) {
        return {
          value: null,
          output: interp.output.slice(start),
          error: asPyError(e),
        }
      }
    },
  }
}

/** Builds a value from a Python literal, e.g. `[1, 2]`, `"Alex"`, `-3`. */
export function literal(source: string): Value {
  return new Interpreter().eval(parseExpression(source), new Map())
}
