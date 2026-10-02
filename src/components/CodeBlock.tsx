import './CodeBlock.css'

interface CodeBlockProps {
  fileName: string
  lines: string[]
  /** 1-based line number to mark as the bug. */
  highlightLine?: number
}

function CodeBlock({ fileName, lines, highlightLine }: CodeBlockProps) {
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
            <code>{line}</code>
          </div>
        ))}
      </pre>
    </figure>
  )
}

export default CodeBlock
