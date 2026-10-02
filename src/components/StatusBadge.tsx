import './StatusBadge.css'

export type StatusState = 'idle' | 'ok' | 'fail'

interface StatusBadgeProps {
  /** e.g. "System", "Security". */
  label: string
  /** e.g. "Corrupted", "Unlocked". */
  value: string
  state: StatusState
}

/** LED + "LABEL: VALUE" readout. Announced when it changes. */
function StatusBadge({ label, value, state }: StatusBadgeProps) {
  return (
    <p className={`status-badge status-badge--${state}`} role="status">
      <span className="status-badge__led" aria-hidden="true" />
      <span className="status-badge__label">{label}:</span>{' '}
      <span className="status-badge__value">{value}</span>
    </p>
  )
}

export default StatusBadge
