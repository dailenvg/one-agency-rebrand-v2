import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import { concepts, type Concept, type ConceptId } from '../data/concepts'
import { logoUrl } from '../lib/logos'
import { goToKit } from '../lib/nav'
import { duration, ease, fadeUp, press, spring, stagger, viewport } from '../lib/motion'
import { displayStyle } from '../lib/type'
import { useTheme } from '../theme/context'
import { PaletteBar } from './ui/PaletteBar'

/** Small screens: the strip becomes full-width bands that open one at a time. */
export function ConceptAccordion() {
  const { concept: applied, select } = useTheme()
  const [open, setOpen] = useState<ConceptId | null>(applied.id)
  const radius = Math.min(applied.radius.md, 24)
  return (
    <motion.ul
      aria-label="Concepts"
      variants={stagger(0.05)}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className="flex flex-col gap-1.5 px-1.5"
    >
      {concepts.map((c) => (
        <Band
          key={c.id}
          c={c}
          radius={radius}
          open={open === c.id}
          applied={applied.id === c.id}
          onToggle={() => setOpen((o) => (o === c.id ? null : c.id))}
          onApply={() => goToKit(select, c.id)}
        />
      ))}
    </motion.ul>
  )
}

interface BandProps {
  c: Concept
  radius: number
  open: boolean
  applied: boolean
  onToggle: () => void
  onApply: () => void
}

function Band({ c, radius, open, applied, onToggle, onApply }: BandProps) {
  const d = c.theme.dark
  const id = `concept-band-${c.id}`
  const soft = `color-mix(in srgb, ${d.heroInk} 14%, transparent)`
  return (
    <motion.li variants={fadeUp} className="relative overflow-hidden" style={{ borderRadius: radius, background: d.heroBg, color: d.heroInk }}>
      <h3 className="relative">
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          // gap-3, not 4: the applied band also carries a chip, and a wide face (Unbounded, about 3.1em for "Nova") would
          // otherwise truncate its name on 360px phones.
          className="flex min-h-[88px] w-full cursor-pointer items-center gap-3 rounded-[inherit] px-5 text-left focus-visible:outline-offset-[-6px]"
          style={{ outlineColor: d.heroInk }}
        >
          <span className="label opacity-60">{c.index}</span>
          <span className="display-slot min-w-0 flex-1 truncate text-[calc(2rem*var(--x-scale))]" style={displayStyle(c)}>
            {c.name}
          </span>
          {applied && (
            <span className="label rounded-[3px] px-2 py-1 leading-none" style={{ background: d.accent, color: d.accentInk }}>
              Applied
            </span>
          )}
          <img src={logoUrl(c.id, 'mark', 'dark')} alt="" className="h-7 w-auto max-w-12 object-contain" />
          <motion.span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full"
            style={{ background: soft }}
            animate={{ rotate: open ? 180 : 0 }}
            transition={spring.snappy}
          >
            <CaretDown size={14} />
          </motion.span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-button`}
            className="relative overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: spring.layout, opacity: { duration: duration.component, ease: ease.out } }}
          >
            <div className="flex flex-col gap-5 px-5 pb-5">
              <div className="relative aspect-[16/10]">
                {/* Sized by the box, not the SVG's intrinsic pixels, so wide and stacked lockups both fit. */}
                <img src={logoUrl(c.id, 'primary', 'dark')} alt={`${c.name} logo`} className="absolute inset-0 m-auto h-[56%] w-[78%] object-contain" />
              </div>
              <p className="text-lead opacity-80">{c.tagline}</p>
              <PaletteBar c={c} className="h-2" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="label opacity-70">{c.type.display.family}</span>
                <motion.button
                  {...press}
                  type="button"
                  onClick={onApply}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold"
                  style={{ background: d.accent, color: d.accentInk }}
                >
                  {applied ? 'Open the brand kit' : 'Apply & open kit'} <ArrowRight size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}
