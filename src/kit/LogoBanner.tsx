import { DownloadSimple } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import type { Concept } from '../data/concepts'
import { fade, press, viewport } from '../lib/motion'
import { useTheme } from '../theme/context'
import { KitModule } from './KitModule'
import { LogoReel, reelControl } from './LogoReel'

/**
 * The logo reel as a full-bleed banner: the stage widens to the viewport's aspect and every scene recomposes for it.
 * Follows the concept switcher, plays while on screen and shares its play or pause choice with the 9:16 reel.
 */
export function LogoBanner() {
  const { concept: c } = useTheme()
  const anchor = useRef<HTMLDivElement>(null)
  const bleed = useFullBleed(anchor)
  return (
    <KitModule
      id="banner"
      title="Logo banner"
      intro="The logo reel recomposed for wide screens, filling the frame edge to edge for website heroes, stage screens and event loops."
      wide
    >
      <div ref={anchor}>
        <motion.div
          variants={fade}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative h-svh overflow-hidden"
          style={{ ...bleed, background: c.theme.dark.heroBg }}
        >
          <LogoReel c={c} fluid name="logo banner" controls={(toggle) => <BannerControls c={c} toggle={toggle} />} />
        </motion.div>
      </div>
    </KitModule>
  )
}

/** Bottom bar over the banner, clear of the sticky rails above and of any device safe area. */
function BannerControls({ c, toggle }: { c: Concept; toggle: ReactNode }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3"
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <span className="label inline-flex min-h-11 items-center gap-2 rounded-full bg-black/50 px-4 text-white ring-1 ring-white/25 backdrop-blur ring-inset">
        <span aria-hidden className="size-2 rounded-full" style={{ background: c.theme.dark.accent }} />
        {c.name}
      </span>
      <div className="flex gap-2">
        <motion.a
          {...press}
          href={`${import.meta.env.BASE_URL}reels/${c.id}-banner.gif`}
          download={`one-agency-${c.id}-logo-banner.gif`}
          aria-label={`Download the ${c.name} logo banner as a GIF`}
          title="Download GIF"
          className={reelControl}
        >
          <DownloadSimple size={18} weight="bold" aria-hidden />
        </motion.a>
        {toggle}
      </div>
    </div>
  )
}

/**
 * Breaks a child of a centred, padded column out to the full viewport width. Measures the column against the root's
 * client width rather than using 100vw, which includes a classic scrollbar and would overflow sideways.
 */
function useFullBleed(anchor: RefObject<HTMLElement | null>): CSSProperties {
  const [bleed, setBleed] = useState<CSSProperties>({ marginInline: 'calc(50% - 50vw)', width: '100vw' })
  useLayoutEffect(() => {
    const el = anchor.current
    if (!el) return
    const root = document.documentElement
    const measure = () => setBleed({ marginLeft: -el.getBoundingClientRect().left, width: root.clientWidth })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    observer.observe(root)
    return () => observer.disconnect()
  }, [anchor])
  return bleed
}
