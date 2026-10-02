interface InlineCodeProps {
  text: string
}

/** Renders text, turning `backtick` segments into <code> elements. */
function InlineCode({ text }: InlineCodeProps) {
  return (
    <>
      {text
        .split('`')
        .map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : part))}
    </>
  )
}

export default InlineCode
