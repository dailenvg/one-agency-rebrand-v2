import { motion, useReducedMotion, useScroll, useTransform, type HTMLMotionProps, type MotionValue } from 'motion/react'
import { Circle, Plus, Square } from '@phosphor-icons/react'
import { useRef, type ReactNode } from 'react'
import { duration, ease, fadeUp, press, stagger, viewport, wordReveal } from '../../lib/motion'

/** Hero label set as text on the accent colour, like a highlighter mark. */
export function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <span className="label inline-flex items-center gap-1.5 rounded-[3px] bg-accent px-2 py-1 leading-none text-accent-ink [box-decoration-break:clone]">
      {index && <span className="opacity-60">{index} /</span>}
      {children}
    </span>
  )
}

/** Inline highlight box, the Reachwise-style marker behind a key word. */
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <motion.span
        aria-hidden
        className="absolute inset-x-[-0.08em] inset-y-[0.04em] origin-left rounded-[0.12em] bg-accent"
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: duration.page, ease: ease.out, delay: 0.25 } } }}
      />
      <span className="relative text-accent-ink">{children}</span>
    </span>
  )
}

type ButtonProps = Omit<HTMLMotionProps<'a'>, 'children'> & { variant?: 'primary' | 'ghost' | 'hero-ghost'; icon?: ReactNode; children?: ReactNode }

export function Button({ variant = 'primary', icon, children, className = '', ...rest }: ButtonProps) {
  const styles = {
    primary: 'bg-accent text-accent-ink hover:brightness-95',
    ghost: 'bg-surface text-ink shadow-soft hover:bg-surface2',
    'hero-ghost': 'bg-white/8 text-hero-ink ring-1 ring-white/12 ring-inset hover:bg-white/14',
  }[variant]
  return (
    <motion.a
      {...press}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${styles} ${className}`}
      {...rest}
    >
      {children}
      {icon && (
        <span className={`grid size-6 place-items-center rounded-full ${variant === 'primary' ? 'bg-accent-ink text-accent' : 'bg-accent text-accent-ink'}`}>
          {icon}
        </span>
      )}
    </motion.a>
  )
}

/**
 * Editorial section label: an accent plus, a two-digit index and a short name, as in "+ 01  The brief". `onHero` takes
 * the glow colour for the plus, for sections set on the hero colour.
 */
export function SectionEyebrow({ index, children, onHero = false }: { index: ReactNode; children: ReactNode; onHero?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm leading-none">
      <Plus aria-hidden size={12} weight="bold" className={onHero ? 'text-glow' : 'text-accent-text'} />
      <span className="font-mono text-xs font-semibold tabular-nums">{index}</span>
      <span className="font-medium opacity-75">{children}</span>
    </span>
  )
}

/**
 * Section opener on the column guides: eyebrow and a big, tight headline on the left half, and the lead set large on
 * the right half, inking in word by word as it scrolls into view.
 */
export function SectionHeading({ index, eyebrow, title, body }: { index: string; eyebrow: string; title: ReactNode; body?: string }) {
  return (
    <div className="grid gap-y-8 lg:grid-cols-4">
      <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={viewport} className="flex flex-col items-start gap-6 lg:col-span-2 lg:pr-12">
        <motion.div variants={fadeUp}>
          <SectionEyebrow index={index}>{eyebrow}</SectionEyebrow>
        </motion.div>
        <motion.h2 variants={fadeUp} className="font-shell text-h2 font-semibold text-balance">
          {title}
        </motion.h2>
      </motion.div>
      {body && (
        <div className="lg:col-span-2 lg:pt-14">
          <ScrollRevealText text={body} className="max-w-[36ch] text-lead-xl font-medium text-pretty" />
        </div>
      )}
    </div>
  )
}

/**
 * A paragraph that inks in word by word as it scrolls up, from faint to full colour. With reduced motion it is simply
 * set in full colour. The words stay plain text, so it reads normally to assistive tech.
 */
export function ScrollRevealText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: wordReveal.offset })
  const words = text.split(' ')
  return (
    <p ref={ref} className={className}>
      {reduce
        ? text
        : words.map((w, i) => (
            <Word key={i} progress={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>
              {w}
            </Word>
          ))}
    </p>
  )
}

function Word({ progress, from, to, children }: { progress: MotionValue<number>; from: number; to: number; children: string }) {
  const opacity = useTransform(progress, [from, to], [wordReveal.dim, 1])
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{' '}
    </>
  )
}

/** Small corner marks (+ ○ + □) that frame a card, a quiet drafting-table detail. Place inside a positioned card. */
export function CornerTicks({ className = 'text-current opacity-30' }: { className?: string }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-2.5 ${className}`}>
      <Plus size={9} weight="regular" className="absolute top-0 left-0" />
      <Circle size={8} weight="regular" className="absolute top-0 right-0" />
      <Plus size={9} weight="regular" className="absolute bottom-0 left-0" />
      <Square size={8} weight="regular" className="absolute right-0 bottom-0" />
    </span>
  )
}

/** An oversized index number ghosted behind a card's content, cropped by the card's top edge. */
export function GhostNumber({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -top-[0.06em] left-4 font-shell text-ghost font-semibold tabular-nums opacity-[0.07] select-none ${className}`}
    >
      {children}
    </span>
  )
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: duration.page, ease: ease.out, delay }}
    >
      {children}
    </motion.div>
  )
}
