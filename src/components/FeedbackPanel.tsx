import type { ReactNode, RefObject } from 'react'
import InlineCode from './InlineCode.tsx'
import './FeedbackPanel.css'

interface FeedbackPanelProps {
  correct: boolean
  xpEarned: number
  title: string
  /** Why the player's pick failed (wrong answers only). */
  whyNot?: string
  isLast: boolean
  onNext: () => void
  headingRef: RefObject<HTMLHeadingElement | null>
  children: ReactNode
}

function FeedbackPanel({
  correct,
  xpEarned,
  title,
  whyNot,
  isLast,
  onNext,
  headingRef,
  children,
}: FeedbackPanelProps) {
  return (
    <section
      className={`feedback ${correct ? 'feedback--correct' : 'feedback--wrong'}`}
      aria-live="polite"
    >
      <div className="feedback__header">
        <h2 ref={headingRef} tabIndex={-1}>
          {title}
        </h2>
        <span className="feedback__xp">+{xpEarned} XP</span>
      </div>
      {!correct && whyNot && (
        <p className="feedback__why-not">
          <InlineCode text={whyNot} />
        </p>
      )}
      {children}
      <button type="button" className="btn btn--primary" onClick={onNext}>
        {isLast ? 'Finish' : 'Next challenge'}
      </button>
    </section>
  )
}

export default FeedbackPanel
