import { AppWindow, Drop, Intersect, NumberCircleOne, type Icon } from '@phosphor-icons/react'
import { motion, type TargetAndTransition } from 'motion/react'
import { ease } from '../../lib/motion'

export type CriteriaKind = 'favicon' | 'one' | 'colour' | 'sister'

/** Each icon acts out its criterion on a slow loop: shrink to favicon size, flip the 1, drip colour, overlap. */
const icons: Record<CriteriaKind, { I: Icon; loop: TargetAndTransition }> = {
  favicon: { I: AppWindow, loop: { scale: [1, 0.55, 0.55, 1], transition: { duration: 1.6, times: [0, 0.3, 0.7, 1], ease: ease.inOut, repeat: Infinity, repeatDelay: 1.4 } } },
  one: { I: NumberCircleOne, loop: { rotateY: [0, 360], transition: { duration: 1.1, ease: ease.inOut, repeat: Infinity, repeatDelay: 2.2 } } },
  colour: { I: Drop, loop: { y: [0, -5, 3, 0], scaleY: [1, 1.08, 0.92, 1], transition: { duration: 1.2, ease: ease.out, repeat: Infinity, repeatDelay: 1.8 } } },
  sister: { I: Intersect, loop: { rotate: [0, 180], transition: { duration: 1.2, ease: ease.inOut, repeat: Infinity, repeatDelay: 2 } } },
}

export function CriteriaIcon({ kind, delay = 0 }: { kind: CriteriaKind; delay?: number }) {
  const { I, loop } = icons[kind]
  return (
    <span className="grid size-14 place-items-center rounded-brand-sm bg-accent text-accent-ink [perspective:200px]">
      <motion.span className="grid place-items-center" animate={{ ...loop, transition: { ...loop.transition, delay } } as TargetAndTransition}>
        <I size={28} weight="duotone" />
      </motion.span>
    </span>
  )
}
