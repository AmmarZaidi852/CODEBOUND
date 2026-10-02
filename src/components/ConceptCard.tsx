import InlineCode from './InlineCode.tsx'
import './ConceptCard.css'

interface ConceptCardProps {
  concept: string
  lesson: string
}

function ConceptCard({ concept, lesson }: ConceptCardProps) {
  return (
    <section className="concept-card" aria-label="Concept">
      <p className="concept-card__name">{concept}</p>
      <p>
        <InlineCode text={lesson} />
      </p>
    </section>
  )
}

export default ConceptCard
