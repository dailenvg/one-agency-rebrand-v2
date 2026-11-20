import type { ConceptId } from '../../data/concepts'
import { reel } from '../../lib/motion'
import { MARK } from './stage'

/**
 * A concept's signature move for the locked mark, taken from its motion signature in the Graphic language module.
 * Keyframes run over `duration` seconds from the cut, at the `at` offsets, and always end at rest, so the mark's
 * resting box never changes. Only transforms, opacity and clipping move.
 */
export interface MarkMove {
  duration: number
  at: number[]
  y?: number[]
  scale?: number[]
  scaleX?: number[]
  rotate?: number[]
  opacity?: number[]
  clipPath?: string[]
}

export const markMoves: Record<ConceptId, MarkMove> = {
  /** The square corner swings round into the top right as the O settles. */
  nova: { duration: reel.move, at: [0, 0.6, 1], rotate: [-90, 6, 0], scale: [0.6, 1.06, 1] },
  /** Stencil wipe: the mark is cut in from the left. */
  volt: { duration: reel.move, at: [0, 1], clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'] },
  /** The arcs rise into place. */
  arc: { duration: reel.move, at: [0, 1], y: [MARK.h * 0.4, 0], opacity: [0, 1] },
  /** The capsule stretches out and settles. */
  pill: { duration: reel.move, at: [0, 0.7, 1], scaleX: [0.3, 1.08, 1] },
}

/**
 * How a cut wipes its new scene in, as `k` runs 0 to 1 over `reel.cut` seconds, on a stage `w` units wide. At 1 it
 * must be fully shown.
 */
export interface CutStyle {
  clipPath: string
  x: number
}

const SHOWN: CutStyle = { clipPath: 'none', x: 0 }
const pct = (v: number) => `${(v * 100).toFixed(2)}%`
const clip = (clipPath: string): CutStyle => ({ clipPath, x: 0 })

/** Corner radius of Nova's wipe, in stage units: the O's rounding at reel scale. */
const OPEN_CORNER = 64
/** Arc's wipe is a circle rising from the bottom edge; this radius (as a CSS circle() share) reaches the top corners. */
const ARC_REACH = 1.3
/** Pill's capsule opens to this inset (a share of the height) before it opens vertically. */
const CAPSULE_INSET = 0.4

export const cutIns: Record<ConceptId, (k: number, w: number) => CutStyle> = {
  /** The new scene opens out of the top right corner in the O's own shape: three round corners, one square. */
  nova: (k) => (k >= 1 ? SHOWN : clip(`inset(0 0 ${pct(1 - k)} ${pct(1 - k)} round ${OPEN_CORNER}px 0 ${OPEN_CORNER}px ${OPEN_CORNER}px)`)),
  /** Stencil wipe, left to right, with a hard edge. */
  volt: (k) => (k >= 1 ? SHOWN : clip(`inset(0 ${pct(1 - k)} 0 0)`)),
  /** An arc rises from the bottom edge. */
  arc: (k) => (k >= 1 ? SHOWN : clip(`circle(${pct(k * ARC_REACH)} at 50% 100%)`)),
  /** A capsule stretches out from the centre, then fills the frame. */
  pill: (k) => {
    if (k >= 1) return SHOWN
    const stretch = Math.min(1, k * 2)
    const fill = Math.max(0, k * 2 - 1)
    const side = pct(0.5 * (1 - stretch))
    const edge = pct(CAPSULE_INSET * (1 - fill))
    return clip(`inset(${edge} ${side} ${edge} ${side} round 999px)`)
  },
}
