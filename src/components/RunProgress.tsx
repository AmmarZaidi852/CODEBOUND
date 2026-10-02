import './RunProgress.css'

interface RunProgressProps {
  label: string
  index: number
  total: number
}

function RunProgress({ label, index, total }: RunProgressProps) {
  return (
    <div className="run-progress">
      <p className="eyebrow">
        {label} · {index + 1}/{total}
      </p>
      <ol className="run-progress__pips" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={i < index ? 'done' : i === index ? 'current' : undefined}
          />
        ))}
      </ol>
    </div>
  )
}

export default RunProgress
