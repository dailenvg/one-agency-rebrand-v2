import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown } from '@phosphor-icons/react'
import { company } from '../data/concepts'
import { useAccentEdge } from '../lib/hooks'
import { crossfade, fadeUp, stagger } from '../lib/motion'
import { useTheme } from '../theme/context'
import { HeroConceptCard } from './HeroConceptCard'
import { HeroPhoto } from './HeroPhoto'
import { Button, Eyebrow } from './ui/primitives'

/**
 * Full-screen, full-bleed photo of the selected concept with its tagline set large in the lower left and a glass card
 * for the concept in the lower right. It is at least one screen tall and grows if its copy ever needs more (a landscape
 * phone), so nothing is clipped. A concept change crossfades the photo, headline and card; under reduced motion the
 * entrance and the swap are plain fades (MotionConfig drops the transforms).
 */
export function Hero() {
  const { concept } = useTheme()
  // Light-mode Nova and Pill accents (both violet) sit under 3:1 on their plum hero colour; the nav rings them, so match.
  const edge = useAccentEdge(true)

  return (
    <section id="top" className="relative isolate flex min-h-svh flex-col overflow-hidden bg-hero text-hero-ink">
      <div className="absolute inset-0 -z-20">
        <AnimatePresence initial={false}>
          <HeroPhoto key={concept.id} id={concept.id} />
        </AnimatePresence>
      </div>
      {/*
        Hero-colour scrims: a deep one up from the bottom and in from the left under the copy, a light one down from the
        top under the nav pill, so light ink holds WCAG AA on every concept's photo, pale ones included.
      */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-hero/90 via-hero/75 via-50% to-transparent sm:h-44" />
        <div className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-hero/95 via-hero/60 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-hero/85 via-hero/50 to-transparent md:w-3/4" />
      </div>

      <motion.div
        variants={stagger(0.09, 0.15)}
        initial="hidden"
        animate="show"
        className="container-x flex flex-1 flex-col justify-end gap-8 pt-40 pb-stack md:pt-32 lg:flex-row lg:items-end lg:justify-between [@media(max-height:560px)]:pt-24"
      >
        <div className="flex max-w-4xl min-w-0 flex-col items-start">
          <motion.div variants={fadeUp}>
            <Eyebrow>{company.name} · Rebrand 2026</Eyebrow>
          </motion.div>
          <motion.h1 variants={fadeUp} className="display mt-5 max-w-[8.5em] text-billboard text-balance sm:mt-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={concept.id} variants={crossfade} initial="initial" animate="animate" exit="exit" className="block">
                {concept.tagline}
              </motion.span>
            </AnimatePresence>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-[46ch] text-lead text-hero-ink/85 text-pretty sm:mt-6">
            Four logo concepts, each with a full brand kit. Pick any of V1 to V4 above and the whole page changes to
            match.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3 sm:mt-8">
            <Button href="#concepts" icon={<ArrowDown size={14} />} className={edge}>
              See all four concepts
            </Button>
            <Button href="#kit" variant="hero-ghost" className="backdrop-blur-md">
              Open the {concept.name} brand kit
            </Button>
          </motion.div>
        </div>
        {/*
          Bottom right on every screen that shows it: below the CTAs on tablets (where the row stacks), beside them from
          1024px. Left out on short, narrow screens (a landscape phone), where it would only push the copy up a screen
          for a second link to the kit the ghost CTA already gives.
        */}
        <div className="hidden shrink-0 md:block md:self-end [@media(max-width:1023px)_and_(max-height:560px)]:hidden">
          <HeroConceptCard concept={concept} variants={fadeUp} />
        </div>
      </motion.div>
    </section>
  )
}
