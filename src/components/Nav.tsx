import { AnimatePresence, motion } from 'motion/react'
import { useMediaQuery, useScrollSpy, useScrolledPast } from '../lib/hooks'
import { logoUrl, wideLogo } from '../lib/logos'
import { duration, morph, press } from '../lib/motion'
import { sectionIds } from '../lib/nav'
import { useTheme } from '../theme/context'
import { ConceptSwitch } from './ConceptSwitch'
import { ModeToggle } from './ModeToggle'
import { SectionTabs } from './SectionTabs'

/** Pill radius in the floating state: half the 60px pill, so its ends stay round while it morphs. */
const PILL_RADIUS = 30

/**
 * A floating pill over the hero (logo, concept switch, mode switch) that morphs into a full-width bar once the hero has
 * scrolled away. The bar is two rows on every screen: the main menu (the concept switch and the mode switch, with the logo from
 * tablet up) and, under a hairline, a thin page menu row. On phones the main row drops the logo and packs the two
 * switches compactly so it stays one 64px row. DOM order is visual order, so Tab runs main menu first, then pages.
 */
export function Nav() {
  const { concept, mode } = useTheme()
  const scrolled = useScrolledPast('top')
  const active = useScrollSpy(sectionIds)
  const tablet = useMediaQuery('(min-width: 768px)')
  const onHero = !scrolled
  const showLogo = onHero || tablet
  // Scrolled phone bar: the switches share one row, so both take their compact form.
  const compact = scrolled && !tablet
  const logoMode = onHero ? 'dark' : mode
  const surface = { borderRadius: scrolled ? 0 : PILL_RADIUS }

  return (
    // layoutRoot: the header is fixed, so its layout animations must ignore page scroll.
    <motion.header layoutRoot className="fixed inset-x-0 top-0 z-50">
      <div className={scrolled ? '' : 'container-x pt-2 sm:pt-4'}>
        <nav aria-label="Primary" className={`relative ${onHero ? 'on-hero' : ''}`}>
          <motion.span aria-hidden layout initial={false} animate={surface} transition={morph} className="absolute inset-0 -z-10 backdrop-blur-xl" />
          <motion.span
            aria-hidden
            layout
            initial={false}
            animate={{ ...surface, opacity: scrolled ? 1 : 0 }}
            transition={morph}
            className="absolute inset-0 -z-10 border-b border-line bg-bg/90"
          />
          <div
            className={`flex items-center gap-y-1 md:gap-x-3 ${
              // Bar height matches --nav-h in index.css on every screen: a 64px main row (8 + 48 + 8) plus the 44px
              // page menu row, 108px.
              scrolled ? 'container-x min-h-16 py-2' : 'flex-wrap md:flex-nowrap md:py-2 md:pr-2 md:pl-5'
            }`}
          >
            {/*
              Once the phone bar drops the logo this collapses to zero width with no gap (the column gap is tablet up
              only), and stretches to the row's height so the popped-out logo fades where it stood instead of dropping.
            */}
            <div className={`relative flex min-w-0 items-center ${showLogo ? 'flex-1' : 'self-stretch'}`}>
              <AnimatePresence mode="popLayout" initial={false}>
                {showLogo && (
                  <motion.a
                    key="logo"
                    {...press}
                    layout="position"
                    href="#top"
                    aria-label={`ONE Agency, ${concept.name} concept, back to top`}
                    className="flex h-11 shrink-0 items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={morph}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.img
                        key={concept.id + logoMode}
                        src={logoUrl(concept.id, wideLogo(concept.id), logoMode)}
                        alt=""
                        className="h-6 w-auto max-w-[150px] sm:h-7 sm:max-w-[180px]"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: duration.micro }}
                      />
                    </AnimatePresence>
                  </motion.a>
                )}
              </AnimatePresence>
            </div>
            <motion.div
              layout="position"
              transition={morph}
              // Over the hero on phones the switch wraps to its own full-width row; in the bar it shares the main row.
              className={`md:order-none md:w-auto md:flex-none ${scrolled ? 'min-w-0 flex-1' : 'order-last w-full'}`}
            >
              <ConceptSwitch onHero={onHero} compact={compact} />
            </motion.div>
            <motion.div layout="position" transition={morph} className="flex justify-end pl-2 md:flex-1 md:pl-0">
              <ModeToggle onHero={onHero} compact={compact} />
            </motion.div>
          </div>
          {/* popLayout: the row leaves the flow at once, so the surface shrinks with the morph while the row fades. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {scrolled && (
              <motion.div key="tabs-row" className="container-x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={morph}>
                {/* The row is the bar's last 44px: its bottom edge is the nav's, where the surface draws its 1px hairline. */}
                <div className="relative flex h-11 items-center before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-line">
                  <SectionTabs active={active} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  )
}
