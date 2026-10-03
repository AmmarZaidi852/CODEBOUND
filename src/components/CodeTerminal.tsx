import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import './CodeTerminal.css'

interface CodeTerminalProps {
  id: string
  /** Shown in the header and used as the editor's accessible name. */
  fileName: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  /** Restores the starting code. */
  onReset?: () => void
  resetDisabled?: boolean
  /** Frame colour after a check. */
  state?: '' | 'ok' | 'fail'
  /** Extra id(s) describing the editor, e.g. its instructions. */
  describedBy?: string
}

const INDENT = '    '

// Display-only colouring. Words and numbers keep their meaning in plain
// text too; colour is never the only signal.
const TOKEN =
  /(#.*$)|("[^"]*"?|'[^']*'?)|(\b\d+(?:\.\d+)?\b)|(\b(?:if|elif|else|for|in|def|return|and|or|not|True|False|None|pass)\b)|(\b(?:print|len|range|str|int|append|pop)\b)/g
const CLASSES = ['', 'comment', 'string', 'number', 'keyword', 'builtin']

function highlight(line: string): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of line.matchAll(TOKEN)) {
    const at = match.index
    if (at > last) parts.push(line.slice(last, at))
    const group = match.findIndex((g, i) => i > 0 && g !== undefined)
    parts.push(
      <span key={at} className={`tk-${CLASSES[group]}`}>
        {match[0]}
      </span>,
    )
    last = at + match[0].length
  }
  if (last < line.length) parts.push(line.slice(last))
  return parts
}

/**
 * CODEBOUND's code editor: a plain textarea over a highlighted copy of
 * the code. Enter keeps the indentation (and adds one level after `:`);
 * Backspace in leading spaces removes one level. Tab is left alone so
 * keyboard users can always move on.
 */
function CodeTerminal({
  id,
  fileName,
  value,
  onChange,
  readOnly = false,
  onReset,
  resetDisabled = false,
  state = '',
  describedBy,
}: CodeTerminalProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const layerRef = useRef<HTMLPreElement>(null)
  const caret = useRef<number | null>(null)
  const lines = value.split('\n')

  // Put the caret back after a programmatic edit (auto-indent).
  useLayoutEffect(() => {
    if (caret.current !== null && areaRef.current) {
      areaRef.current.setSelectionRange(caret.current, caret.current)
      caret.current = null
    }
  }, [value])

  function replace(start: number, end: number, text: string) {
    caret.current = start + text.length
    onChange(value.slice(0, start) + text + value.slice(end))
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (readOnly || e.nativeEvent.isComposing) return
    const { selectionStart: start, selectionEnd: end } = e.currentTarget
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const before = value.slice(lineStart, start)

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      const indent = /^ */.exec(before)![0]
      const extra = before.trimEnd().endsWith(':') ? INDENT : ''
      replace(start, end, `\n${indent}${extra}`)
      return
    }

    if (e.key === 'Backspace' && start === end && /^ +$/.test(before)) {
      e.preventDefault()
      const remove = before.length % 4 || 4
      replace(start - Math.min(remove, before.length), start, '')
    }
  }

  function syncScroll() {
    if (areaRef.current && layerRef.current) {
      layerRef.current.style.transform = `translate(${-areaRef.current.scrollLeft}px, 0)`
    }
  }

  return (
    <div className={`code-terminal ${state}`}>
      <div className="code-terminal__header">
        <span className="code-terminal__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <label htmlFor={id}>{fileName}</label>
        {readOnly && <span className="code-terminal__lock">Read only</span>}
        {onReset && !readOnly && (
          <button
            type="button"
            className="btn btn--ghost code-terminal__reset"
            disabled={resetDisabled}
            onClick={onReset}
          >
            Reset
          </button>
        )}
      </div>
      <div className="code-terminal__body">
        <pre className="code-terminal__gutter" aria-hidden="true">
          {lines.map((_, i) => `${i + 1}\n`)}
        </pre>
        <div className="code-terminal__editor">
          <pre
            ref={layerRef}
            className="code-terminal__layer"
            aria-hidden="true"
          >
            {lines.map((line, i) => (
              <span key={i}>
                {highlight(line)}
                {'\n'}
              </span>
            ))}
          </pre>
          <textarea
            ref={areaRef}
            id={id}
            className="code-terminal__input"
            value={value}
            rows={Math.max(lines.length, 3)}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-describedby={describedBy}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
          />
        </div>
      </div>
    </div>
  )
}

export default CodeTerminal
