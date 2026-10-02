import './ListCells.css'

export type CellState = '' | 'picked' | 'correct' | 'wrong'

interface ListCellsProps {
  /** Shown before the brackets, e.g. "scores =". */
  label: string
  values: readonly number[]
  showIndexes?: boolean
  /** When set, each cell is a button. */
  onCellClick?: (index: number) => void
  /** Accessible name for a clickable cell. */
  cellLabel?: (value: number, index: number) => string
  cellState?: (index: number) => CellState
  disabled?: boolean
  /** Shown inside the brackets while the list is empty. */
  placeholder?: string
}

/** A Python list drawn as cells: label = [ 12 ][ 18 ][ 7 ], with optional index labels. */
function ListCells({
  label,
  values,
  showIndexes = false,
  onCellClick,
  cellLabel = (value) => String(value),
  cellState = () => '',
  disabled = false,
  placeholder,
}: ListCellsProps) {
  return (
    <div
      className={`list-cells${showIndexes ? ' list-cells--indexed' : ''}`}
      role="group"
      aria-label={label}
    >
      <span className="list-cells__label">{label}</span>
      <span className="list-cells__list">
        <span className="list-cells__bracket" aria-hidden="true">
          [
        </span>
        <ol className="list-cells__items">
          {values.map((value, i) => (
            <li key={i} className={`list-cell ${cellState(i)}`}>
              {showIndexes && (
                <span className="list-cell__index" aria-hidden="true">
                  {i}
                </span>
              )}
              {onCellClick ? (
                <button
                  type="button"
                  className="list-cell__value"
                  disabled={disabled}
                  aria-label={cellLabel(value, i)}
                  onClick={() => onCellClick(i)}
                >
                  {value}
                </button>
              ) : (
                <span className="list-cell__value">{value}</span>
              )}
            </li>
          ))}
          {values.length === 0 && placeholder && (
            <li className="list-cells__empty">{placeholder}</li>
          )}
        </ol>
        <span className="list-cells__bracket" aria-hidden="true">
          ]
        </span>
      </span>
    </div>
  )
}

export default ListCells
