import type { Transition, Variants } from 'motion/react'

/** Shared motion tokens. Import these instead of inlining numbers. */
export const duration = { micro: 0.18, component: 0.32, page: 0.5, wipe: 0.7, pulse: 1.4 } as const

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  emphasized: [0.83, 0, 0.17, 1],
} as const

export const spring = {
  snappy: { type: 'spring', stiffness: 300, damping: 28 },
  soft: { type: 'spring', stiffness: 200, damping: 26 },
  layout: { type: 'spring', stiffness: 260, damping: 30 },
} satisfies Record<string, Transition>

export const press = { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } }

/** The nav morphing between the floating pill over the hero and the full-width bar below it. */
export const morph: Transition = { duration: duration.component, ease: ease.out }

/** Small overlays such as tooltips: a short rise in, a shorter fade out. */
export const popover: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0, transition: { duration: duration.micro, ease: ease.out } },
  exit: { opacity: 0, y: -2, transition: { duration: duration.micro / 2, ease: ease.out } },
}

/**
 * Lead paragraphs that ink in word by word as they scroll up: each word starts at `dim` opacity and is fully inked
 * once the paragraph's end reaches the viewport line in `offset[1]`.
 */
export const wordReveal = { dim: 0.2, offset: ['start 0.9', 'end 0.7'] as ['start 0.9', 'end 0.7'] }

/** Content that appears once its container has settled, and leaves at once. */
export const reveal: Transition = { delay: 0.14, duration: duration.component, ease: ease.out }
export const conceal: Transition = { duration: duration.micro, ease: ease.out }

/** Full-screen layers such as the lightbox backdrop and its controls. */
export const overlay: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.component, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.component, ease: ease.out } },
}

/** A photo eases in slightly inside its frame on hover; the frame stays put. */
export const photoZoom: Variants = {
  rest: { scale: 1, transition: spring.soft },
  hover: { scale: 1.04, transition: spring.soft },
}

/** Pressed state for large tappable surfaces, where a full `press` scale would crowd the gutters. */
export const tap = { whileTap: { scale: 0.98 } }

/**
 * Lightbox photo change: the next photo arrives from the side it was asked for and the last one leaves the other way.
 * `custom` is the direction (1 forward, -1 back, 0 for a plain crossfade under reduced motion).
 */
export const photoSwap: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0, transition: { duration: duration.component, ease: ease.out } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48, transition: { duration: duration.micro, ease: ease.out } }),
}

/** A single element swapped for another on a concept change (the hero photo and headline): a plain crossfade. */
export const crossfade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.page, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.component, ease: ease.out } },
}

/** Skeleton breathing loop. */
export const pulse: Transition = { duration: duration.pulse, ease: ease.inOut, repeat: Infinity }

/**
 * Logo reel: scenes hard-cut on a beat of `scene` seconds around a locked mark. Keep `scene` at 0.5s or more so cuts
 * never exceed two per second (photosensitivity). A loop is the sum of its scenes' beats plus `endHold`, times `scene`.
 */
export const reel = {
  scene: 0.55,
  /** Extra beats the closing scene holds, so the loop lands before it restarts. */
  endHold: 2,
  /** Share of a scene its in-scene move takes; the rest holds still until the cut. */
  settle: 0.7,
  /** Offset between staggered items inside a scene, as a share of the scene. */
  stagger: 0.08,
  /** Seconds a concept's cut takes to wipe the new scene in: three frames at 20 fps, so it still reads as a cut. */
  cut: 0.15,
  /** Share of the wipe already done on the first frame, so the cut lands on its frame rather than one later. */
  cutHead: 1 / 3,
  /** Seconds the locked mark's signature move takes on the scenes that use it. */
  move: 0.4,
  ease: ease.out,
} as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: duration.page, ease: ease.out } },
}

export const rise: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: { opacity: 1, y: 0, transition: spring.soft },
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.component, ease: ease.out } },
}

export const stagger = (step = 0.08, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
})

export const viewport = { once: true, margin: '-10%' } as const

/**
 * Concept swap for whole page sections. Opacity and transform only: a blur filter over a section this size repaints
 * every frame and was the main source of stutter on a concept change. The exit is short because it plays under the wipe.
 */
export const sectionSwap: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.page, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: duration.micro, ease: ease.out } },
}
