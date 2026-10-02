import type { ReactNode, RefObject } from 'react'
import InlineCode from './InlineCode.tsx'
import './FeedbackPanel.css'

interface FeedbackPanelProps {
  correct: boolean
  xpEarned: number
  title: string
  /** Why the player's pick failed (wrong answers only). */
  whyNot?: string
  /** Default action: a Next challenge / Finish button. */
  isLast?: boolean
  onNext?: () => void
  /** Replaces the default Next button, e.g. with several choices. */
  actions?: ReactNode
  headingRef: RefObject<HTMLHeadingElement | null>
  children: ReactNode
}

/**
 * Result terminal: a SYSTEM ONLINE / SYSTEM ERROR strip for the game framing,
 * then plain-language teaching underneath.
 */
function FeedbackPanel({
  correct,
  xpEarned,
  title,
  whyNot,
  isLast,
  onNext,
  actions,
  headingRef,
  children,
}: FeedbackPanelProps) {
  return (
    <section
      className={`feedback ${correct ? 'feedback--correct' : 'feedback--wrong'}`}
      aria-live="polite"
    >
      <div className="feedback__strip">
        <span className="feedback__status">
          <span className="feedback__icon" aria-hidden="true" />
          {correct ? 'System online' : 'System error'}
        </span>
        {xpEarned > 0 && <span className="feedback__xp">+{xpEarned} XP</span>}
      </div>
      <div className="feedback__body">
        <h2 ref={headingRef} tabIndex={-1}>
          {title}
        </h2>
        {!correct && whyNot && (
          <p className="feedback__why-not">
            <InlineCode text={whyNot} />
          </p>
        )}
        {children}
        {actions ?? (
          <div className="feedback__actions">
            <button
              type="button"
              className="btn btn--primary btn--large btn--go"
              onClick={onNext}
            >
              {isLast ? 'Finish' : 'Next challenge'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default FeedbackPanel
