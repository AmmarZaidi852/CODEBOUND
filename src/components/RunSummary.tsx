import './RunSummary.css'

interface RunSummaryProps {
  eyebrow: string
  title: string
  message: string
  runXp: number
  total: number
  solved: number
  onExit: () => void
}

/** Completion screen body shown at the end of a game's challenge run. */
function RunSummary({
  eyebrow,
  title,
  message,
  runXp,
  total,
  solved,
  onExit,
}: RunSummaryProps) {
  return (
    <main className="run-summary">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="run-summary__title">{title}</h1>
      <p>{message}</p>
      <dl className="run-summary__stats">
        <div>
          <dt>XP earned</dt>
          <dd>+{runXp}</dd>
        </div>
        <div>
          <dt>Challenges completed</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>Solved first try</dt>
          <dd>
            {solved}/{total}
          </dd>
        </div>
      </dl>
      <button type="button" className="btn btn--primary" onClick={onExit}>
        Back to games
      </button>
    </main>
  )
}

export default RunSummary
