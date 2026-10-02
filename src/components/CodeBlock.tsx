import './CodeBlock.css'

interface CodeBlockProps {
  fileName: string
  lines: string[]
  /** 1-based line number to mark as the bug. */
  highlightLine?: number
  /** Renders `marker` in the code as a slot showing `value` (or the marker while empty). */
  slot?: { marker: string; value: string | null }
}

function renderLine(line: string, slot: CodeBlockProps['slot']) {
  if (!slot || !line.includes(slot.marker)) return line
  const [before, after] = line.split(slot.marker)
  return (
    <>
      {before}
      <span
        className={`code-block__slot${slot.value ? ' code-block__slot--filled' : ''}`}
      >
        {slot.value ?? slot.marker}
      </span>
      {after}
    </>
  )
}

function CodeBlock({ fileName, lines, highlightLine, slot }: CodeBlockProps) {
  return (
    <figure className="code-block">
      <figcaption className="code-block__header">
        <span className="code-block__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {fileName}
      </figcaption>
      <pre className="code-block__body">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`code-block__line${highlightLine === i + 1 ? ' code-block__line--bug' : ''}`}
          >
            <span className="code-block__number" aria-hidden="true">
              {i + 1}
            </span>
            <code>{renderLine(line, slot)}</code>
          </div>
        ))}
      </pre>
    </figure>
  )
}

export default CodeBlock
