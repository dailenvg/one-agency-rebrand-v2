import { useMediaQuery } from '../lib/hooks'
import { ConceptAccordion } from './ConceptAccordion'
import { ConceptStrip } from './ConceptStrip'
import { Highlight, SectionHeading } from './ui/primitives'

/** Every concept edge to edge: an expanding strip from tablet up, stacked bands on phones. */
export function ConceptExplorer() {
  const wide = useMediaQuery('(min-width: 768px)')
  return (
    <section id="concepts" className="guides bg-surface py-section">
      <div className="container-x">
        <SectionHeading
          index="03"
          eyebrow="The concepts"
          title={
            <>
              Four directions. <Highlight>One</Highlight> decision.
            </>
          }
          body="Hover, focus or tap a concept to open it, then apply it to rebuild the page in that identity."
        />
      </div>
      <div className="mt-stack">{wide ? <ConceptStrip /> : <ConceptAccordion />}</div>
    </section>
  )
}
