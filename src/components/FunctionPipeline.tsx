import './FunctionPipeline.css'

interface FunctionPipelineProps {
  name: string
  /** Argument values; null shows an empty input. */
  inputs: readonly (string | null)[]
  /** Returned value; null shows "?" until the function has run. */
  output: string | null
  state?: '' | 'ok' | 'fault'
  /** Optional goal shown next to the output, e.g. "7". */
  target?: string
}

/** INPUT → FUNCTION → OUTPUT, drawn as a small pipeline. */
function FunctionPipeline({
  name,
  inputs,
  output,
  state = '',
  target,
}: FunctionPipelineProps) {
  return (
    <figure
      className={`pipeline ${state}`}
      aria-label={`${name} pipeline: ${inputs.map((v) => v ?? '?').join(', ') || 'no inputs'} → ${output ?? '?'}`}
    >
      <div className="pipeline__stage">
        <span className="pipeline__label">Input</span>
        <div className="pipeline__inputs">
          {inputs.length === 0 ? (
            <span className="pipeline__none">none</span>
          ) : (
            inputs.map((value, i) => (
              <span
                key={i}
                className={`pipeline__value${value === null ? ' pipeline__value--empty' : ''}`}
              >
                {value ?? '?'}
              </span>
            ))
          )}
        </div>
      </div>
      <span className="pipeline__arrow" aria-hidden="true">
        →
      </span>
      <div className="pipeline__stage">
        <span className="pipeline__label">Function</span>
        <span className="pipeline__fn">{name}()</span>
      </div>
      <span className="pipeline__arrow" aria-hidden="true">
        →
      </span>
      <div className="pipeline__stage">
        <span className="pipeline__label">
          Output
          {target !== undefined && (
            <span className="pipeline__target"> · target {target}</span>
          )}
        </span>
        <span
          className={`pipeline__value pipeline__output${output === null ? ' pipeline__value--empty' : ''}`}
        >
          {output ?? '?'}
        </span>
      </div>
    </figure>
  )
}

export default FunctionPipeline
