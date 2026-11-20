import type { ConceptId } from '../data/concepts'

/** Page sections the scrolled nav links to, in page order. */
export const sections = [
  { id: 'brief', label: 'Brief' },
  { id: 'kit', label: 'Brand kit' },
  { id: 'concepts', label: 'All concepts' },
]
export const sectionIds = sections.map((s) => s.id)

/** Section to jump to while the concept wipe covers the page. Read once by the wipe, then cleared. */
let pendingScroll: string | null = null

/** The wipe calls this while the page is covered, so the jump never shows. */
export function takePendingScroll() {
  const id = pendingScroll
  pendingScroll = null
  return id
}

/**
 * Apply a concept, then bring the brand kit into view. When a wipe runs, the jump happens instantly underneath it
 * and the wipe lifts onto the kit; with no wipe (same concept, reduced motion) the page scrolls there smoothly.
 */
export function goToKit(select: (id: ConceptId) => boolean, id: ConceptId) {
  pendingScroll = 'kit'
  if (!select(id)) {
    pendingScroll = null
    document.getElementById('kit')?.scrollIntoView({ behavior: 'smooth' })
  }
}
