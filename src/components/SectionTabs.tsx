import { motion } from 'motion/react'
import type { Ref } from 'react'
import { morph, spring } from '../lib/motion'
import { sections } from '../lib/nav'

/**
 * The scrolled bar's page menu: anchors to each section, sharing the bar's width evenly, with the one in view
 * underlined. Each tab fills the 44px row, so the underline's `bottom-px` rests it on the bar's 1px bottom hairline.
 * Where the labels cannot fit (min-width auto keeps each tab at its label's width) the row scrolls sideways instead.
 */
export function SectionTabs({ active, ref }: { active: string | null; ref?: Ref<HTMLUListElement> }) {
  return (
    <motion.ul
      ref={ref}
      // layoutScroll: the row can scroll sideways, so the underline's layout animation must account for its scroll offset.
      layoutScroll
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={morph}
      // No padding or negative margin: the focus ring is drawn inside each tab, so nothing pokes past the bar's edge.
      className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto"
    >
      {sections.map((s) => {
        const on = active === s.id
        return (
          <li key={s.id} className="flex flex-1">
            {/*
              The whole tab is the hit area, but hover, press and focus draw on a label-sized pill: a pill as wide as the
              tab would run hairline to hairline, and an outset ring would cross both hairlines and spill under the bar.
            */}
            <a
              href={`#${s.id}`}
              aria-current={on ? 'location' : undefined}
              className={`group flex min-h-11 w-full justify-center px-1 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-hidden ${
                on ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {/* Stretches to the tab's full height, so the underline spans the label and sits on the tab's bottom edge. */}
              <span className="relative flex items-center px-3">
                <span
                  aria-hidden
                  className="absolute inset-x-0 inset-y-2 rounded-full transition-colors group-hover:bg-ink/5 group-focus-visible:outline-2 group-focus-visible:outline-[color:var(--focus-ring,var(--c-accent-text))] group-active:bg-ink/8"
                />
                <span className="relative">{s.label}</span>
                {on && <motion.span layoutId="nav-tab" aria-hidden className="absolute inset-x-3 bottom-px h-0.75 rounded-t-full bg-accent-text" transition={spring.layout} />}
              </span>
            </a>
          </li>
        )
      })}
    </motion.ul>
  )
}
