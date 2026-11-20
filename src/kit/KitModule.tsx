import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { SectionEyebrow } from '../components/ui/primitives'
import { fadeUp, stagger, viewport } from '../lib/motion'
import { useTheme } from '../theme/context'

interface KitModuleProps {
  id: string
  title: string
  intro: ReactNode
  /** Header above the content instead of beside it, for modules that need the full width. */
  wide?: boolean
  children: ReactNode
}

/**
 * One brand kit module on the four column guides: the header takes the first column (sticky beside the content from
 * desktop up), the demos take the other three. Wide modules set the header above and give the demos all four.
 * The index comes from a CSS counter on .kit-modules, so it always follows page order.
 */
export function KitModule({ id, title, intro, wide = false, children }: KitModuleProps) {
  return (
    <section
      id={`kit-${id}`}
      aria-labelledby={`kit-${id}-title`}
      className={`kit-module grid gap-8 border-t border-line py-module first:border-t-0 ${wide ? '' : 'lg:grid-cols-4 lg:gap-0'}`}
    >
      <motion.header
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className={wide ? 'grid gap-4 lg:grid-cols-4 lg:items-end lg:gap-0' : 'lg:sticky lg:top-28 lg:self-start lg:pr-10'}
      >
        <div className={wide ? 'lg:pr-10' : ''}>
          <motion.div variants={fadeUp}>
            <SectionEyebrow index={<span className="kit-index" />}>Brand kit</SectionEyebrow>
          </motion.div>
          <motion.h3 variants={fadeUp} id={`kit-${id}-title`} className="mt-5 font-shell text-h3 font-semibold text-balance">
            {title}
          </motion.h3>
        </div>
        <motion.p variants={fadeUp} className={`max-w-sm text-muted text-pretty ${wide ? 'lg:col-span-2 lg:max-w-xl' : 'mt-4'}`}>
          {intro}
        </motion.p>
      </motion.header>
      <div className={`min-w-0 ${wide ? '' : 'lg:col-span-3'}`}>{children}</div>
    </section>
  )
}

interface TileProps {
  children: ReactNode
  label?: ReactNode
  className?: string
  style?: CSSProperties
  /** Label chip for a dark tile. Leave unset when the tile's background follows the page mode. */
  dark?: boolean
}

/** Generic stage tile used across the kit: soft elevation, no hard border. */
export function Tile({ children, label, className = '', style, dark }: TileProps) {
  const { mode } = useTheme()
  const onDark = dark ?? mode === 'dark'
  return (
    <motion.figure
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      // min-w-0: an aspect ratio plus a min height (the 4:1 banner) otherwise transfers a 600px minimum width and overflows phones.
      className={`relative min-w-0 overflow-hidden rounded-brand-md shadow-soft ${className}`}
      style={style}
    >
      {children}
      {label && (
        <figcaption className={`label absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] backdrop-blur ${onDark ? 'bg-black/35 text-white/85' : 'bg-white/85 text-black/70'}`}>
          {label}
        </figcaption>
      )}
    </motion.figure>
  )
}
