import { motion, useReducedMotion } from 'motion/react'
import { useId, useRef, type CSSProperties } from 'react'
import { useOnScreen } from '../lib/hooks'

/**
 * Film grain: fractal noise laid over a surface, jittered a few pixels per frame like real grain. The jitter only runs
 * on screen: the noise filter is costly to repaint, and off-screen grain would still eat scroll frames.
 */
export function Grain({ opacity = 0.32, blend = 'overlay', frequency = 0.85, live = true }: { opacity?: number; blend?: CSSProperties['mixBlendMode']; frequency?: number; live?: boolean }) {
  const id = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const ref = useRef<SVGSVGElement>(null)
  const onScreen = useOnScreen(ref)
  return (
    <motion.svg
      ref={ref}
      aria-hidden
      // will-change keeps the rasterised noise on its own layer, so the jitter moves pixels instead of re-running the filter.
      className="pointer-events-none absolute -inset-[8%] size-[116%] will-change-transform"
      style={{ mixBlendMode: blend, opacity }}
      animate={live && !reduce && onScreen ? { x: [0, -10, 6, -4, 8, 0], y: [0, 6, -8, 4, -3, 0] } : undefined}
      transition={{ duration: 0.9, repeat: Infinity, ease: (t: number) => Math.floor(t * 6) / 6 }}
    >
      <filter id={`grain-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={3} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${id})`} />
    </motion.svg>
  )
}
