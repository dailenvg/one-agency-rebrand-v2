import { AnimatePresence, motion, type Variants } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import type { Concept } from '../data/concepts'
import { useAccentEdge } from '../lib/hooks'
import { logoUrl } from '../lib/logos'
import { crossfade, press } from '../lib/motion'

/**
 * The one-line pitch the card has room for: the concept's `heroPitch`, or failing that the opening clause of its idea
 * ("Two arcs rising together.").
 */
const pitchOf = (c: Concept) => c.heroPitch ?? `${c.idea.match(/^[^,.]+/)?.[0] ?? c.idea}.`

/**
 * Glass card in the hero's lower right: the selected concept's mark, number and name, and a one-line pitch, linking to
 * its brand kit. Its content crossfades on a concept change; `variants` lets the hero stagger it in with the copy.
 */
export function HeroConceptCard({ concept, variants }: { concept: Concept; variants: Variants }) {
  const edge = useAccentEdge(true)
  return (
    <motion.a
      variants={variants}
      {...press}
      href="#kit"
      aria-label={`Concept ${concept.index}, ${concept.name}. Open the brand kit`}
      className="flex w-[22rem] max-w-full items-center gap-4 rounded-brand-md bg-hero/60 p-3 pr-4 text-hero-ink ring-1 ring-white/15 backdrop-blur-xl ring-inset transition-colors hover:bg-hero/75"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={concept.id} variants={crossfade} initial="initial" animate="animate" exit="exit" className="flex min-w-0 flex-1 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-brand-sm bg-hero ring-1 ring-white/10 ring-inset">
            <img src={logoUrl(concept.id, 'mark', 'dark')} alt="" className="size-10 object-contain" />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="label text-hero-ink/75">
              Concept {concept.index} · {concept.name}
            </span>
            <span className="line-clamp-2 text-sm leading-snug font-medium text-pretty">{pitchOf(concept)}</span>
          </span>
        </motion.span>
      </AnimatePresence>
      <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink ${edge}`}>
        <ArrowRight size={16} />
      </span>
    </motion.a>
  )
}
