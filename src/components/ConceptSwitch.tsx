import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { concepts, type ConceptId } from '../data/concepts'
import { useAccentEdge } from '../lib/hooks'
import { popover, press, reveal, spring } from '../lib/motion'
import { useTheme } from '../theme/context'

/**
 * The nav's main menu: one button per concept, V1 onwards, as a segmented control. Pressing one re-themes the page in
 * place without scrolling. The indicator moves on press, ahead of the wipe, so the choice registers at once.
 * The active segment spells out its concept's name, so touch screens, which get no hover tooltip, still show it.
 * `compact` (the scrolled bar on phones, where the switch shares its row with the mode switch) drops the name and
 * splits the row into one equal segment per concept: 44px or wider from 360px, never overflowing at 320px.
 */
export function ConceptSwitch({ onHero, compact = false }: { onHero: boolean; compact?: boolean }) {
  const { concept, select } = useTheme()
  const edge = useAccentEdge(onHero)
  const [pending, setPending] = useState<ConceptId | null>(null)
  const [tip, setTip] = useState<ConceptId | null>(null)
  const [applied, setApplied] = useState(concept.id)
  if (applied !== concept.id) {
    setApplied(concept.id)
    setPending(null)
  }
  const current = pending ?? concept.id

  return (
    <div
      role="group"
      aria-label="Logo concept"
      onKeyDown={(e) => e.key === 'Escape' && setTip(null)}
      className={`flex w-full rounded-full p-0.5 md:w-auto ${onHero ? 'bg-white/8' : 'bg-surface2'}`}
    >
      {concepts.map((c, i) => {
        const on = c.id === current
        return (
          // layout="position": the active segment is wider (it carries the name), so its neighbours glide, not jump.
          <motion.div key={c.id} layout="position" transition={spring.layout} className={`relative flex-1 md:flex-none ${compact ? 'min-w-0' : ''}`}>
            <motion.button
              whileTap={press.whileTap}
              type="button"
              aria-pressed={on}
              aria-label={`V${i + 1}, ${c.name}`}
              onClick={() => select(c.id) && setPending(c.id)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setTip(c.id)}
              onPointerLeave={() => setTip(null)}
              // Keyboard focus only: a mouse click also focuses, and the hover tip already covers that case.
              onFocus={(e) => e.currentTarget.matches(':focus-visible') && setTip(c.id)}
              onBlur={() => setTip(null)}
              className={`relative inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full font-mono ${
                compact ? 'min-w-0 px-1' : 'min-w-11 px-3'
              } text-[13px] font-semibold tabular-nums whitespace-nowrap transition-colors ${
                on ? 'text-accent-ink' : onHero ? 'text-hero-ink/75 hover:bg-white/8 hover:text-hero-ink' : 'text-muted hover:bg-ink/6 hover:text-ink'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="nav-concept"
                  className={`absolute inset-0 rounded-full bg-accent ${edge}`}
                  // Inline radius so the layout animation corrects it while the pill stretches between segment widths.
                  style={{ borderRadius: 999 }}
                  transition={spring.layout}
                />
              )}
              <span className="relative flex items-center gap-2">
                V{i + 1}
                {on && !compact && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reveal} className="max-[359px]:hidden">
                    {c.name}
                  </motion.span>
                )}
              </span>
            </motion.button>
            <AnimatePresence>
              {tip === c.id && !on && (
                <motion.span
                  aria-hidden
                  variants={popover}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className={`pointer-events-none absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap shadow-soft ${
                    onHero ? 'bg-hero-ink text-hero' : 'bg-ink text-bg'
                  }`}
                >
                  {c.name}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
