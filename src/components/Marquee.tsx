import { motion, useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { useOnScreen } from '../lib/hooks'
import { useTheme } from '../theme/context'

const front = ['Business to Human.', 'We capture intent.', 'Then we convert it.', 'Every comment answered.', 'One accountable team.']
const back = ['Engagement Engineering.', 'Six steps, intent to revenue.', 'Reporting from week two.', 'Built by operators.', 'Leads a sales team calls back.']

/** Agenciex-style crossing ribbons: an accent strip over a soft one, scrolling in opposite directions. */
export function Marquee() {
  const ref = useRef<HTMLElement>(null)
  // Ribbons only scroll while the band is on screen; stopped is the same as reduced motion to the ribbons.
  const prefersReduced = useReducedMotion()
  const onScreen = useOnScreen(ref, '20%')
  const reduce = prefersReduced || !onScreen
  // Dark mode's surface2 nearly matches the hero colour, so there the soft ribbon lifts off the band with a hero-ink tint.
  const soft = useTheme().mode === 'dark' ? 'bg-hero-raised text-hero-ink' : 'bg-surface2 text-ink'
  return (
    // Same hero-colour band and guides as the brand kit header below, so the ribbons flow straight into it.
    <section ref={ref} aria-label="ONE Agency positioning" className="guides guides-hero h-[clamp(170px,22vw,300px)] overflow-hidden bg-hero">
      <Ribbon items={back} top="61%" tilt={-2.2} direction={1} className={soft} reduce={reduce} duration={46} />
      <Ribbon items={front} top="40%" tilt={3} direction={-1} className="bg-accent text-accent-ink shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]" reduce={reduce} duration={38} />
    </section>
  )
}

function Ribbon({
  items, top, tilt, direction, className, reduce, duration,
}: {
  items: string[]; top: string; tilt: number; direction: 1 | -1; className: string; reduce: boolean | null; duration: number
}) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="pr-[0.9em] font-shell font-medium tracking-[-0.01em] whitespace-nowrap">
          {t}
        </li>
      ))}
    </ul>
  )
  return (
    <div className={`absolute left-[-5%] w-[110%] -translate-y-1/2 py-[0.28em] text-[clamp(1.6rem,4.3vw,3.9rem)] leading-tight ${className}`} style={{ top, rotate: `${tilt}deg` }}>
      <motion.div
        className="flex w-max"
        animate={reduce ? undefined : { x: direction < 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {row(false)}
        {row(true)}
      </motion.div>
    </div>
  )
}
