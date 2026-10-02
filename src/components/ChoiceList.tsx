import type { ReactNode } from 'react'
import './ChoiceList.css'

export interface ChoiceItem {
  id: string
  content: ReactNode
}

interface ChoiceListProps {
  legend: string
  items: ChoiceItem[]
  selectedId: string | null
  correctId: string
  /** After submission: lock the list and mark correct / wrong picks. */
  revealed: boolean
  onSelect: (id: string) => void
}

function ChoiceList({
  legend,
  items,
  selectedId,
  correctId,
  revealed,
  onSelect,
}: ChoiceListProps) {
  function stateFor(id: string) {
    if (!revealed) return id === selectedId ? 'selected' : ''
    if (id === correctId) return 'correct'
    return id === selectedId ? 'wrong' : ''
  }

  return (
    <fieldset className="choice-list" disabled={revealed}>
      <legend>{legend}</legend>
      {items.map((item) => (
        <label key={item.id} className={`choice ${stateFor(item.id)}`}>
          <input
            type="radio"
            name="choice"
            value={item.id}
            checked={item.id === selectedId}
            onChange={() => onSelect(item.id)}
          />
          {item.content}
        </label>
      ))}
    </fieldset>
  )
}

export default ChoiceList
