import InlineCode from './InlineCode.tsx'
import './ConceptCard.css'

interface ConceptCardProps {
  concept: string
  lesson: string
}

/** Short concept primer shown above a challenge. */
function ConceptCard({ concept, lesson }: ConceptCardProps) {
  return (
    <section className="concept-card" aria-label="Concept">
      <div>
        <p className="concept-card__name">
          <span className="concept-card__tag">Intel</span>
          {concept}
        </p>
        <p>
          <InlineCode text={lesson} />
        </p>
      </div>
    </section>
  )
}

export default ConceptCard
