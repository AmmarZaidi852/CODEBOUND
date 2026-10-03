import { useEffect, useRef, useState } from 'react'
import { useProgress } from '../progression/ProgressContext.ts'
import './ResetProgress.css'

/**
 * A deliberately quiet "Reset local progress" control. Erasing needs a
 * second, explicit confirmation; Cancel is focused first.
 */
function ResetProgress() {
  const { reset } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Focus Cancel on open; on close, return focus to the reset control.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
    else if (wasOpen.current) openRef.current?.focus()
    wasOpen.current = confirming
  }, [confirming])

  function cancel() {
    setConfirming(false)
  }

  function erase() {
    reset()
    setConfirming(false)
    setDone(true)
  }

  if (confirming) {
    return (
      <section
        className="reset-progress__confirm"
        role="alertdialog"
        aria-labelledby="reset-title"
        aria-describedby="reset-text"
        onKeyDown={(e) => e.key === 'Escape' && cancel()}
      >
        <p id="reset-title" className="reset-progress__title">
          Reset local progress?
        </p>
        <p id="reset-text">
          This erases your XP, level, Foundations and game progress saved in
          this browser. It cannot be undone.
        </p>
        <div className="reset-progress__actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn"
            onClick={cancel}
          >
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={erase}>
            Erase progress
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="reset-progress">
      <button
        ref={openRef}
        type="button"
        className="btn btn--ghost reset-progress__open"
        onClick={() => {
          setDone(false)
          setConfirming(true)
        }}
      >
        Reset local progress
      </button>
      {done && (
        <p className="reset-progress__done" role="status">
          Progress reset. Starting fresh.
        </p>
      )}
    </div>
  )
}

export default ResetProgress
