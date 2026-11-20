import { AnimatePresence, motion } from 'motion/react'
import { CornerTicks, GhostNumber, ScrollRevealText, SectionEyebrow } from '../components/ui/primitives'
import { PaletteBar } from '../components/ui/PaletteBar'
import { logoUrl } from '../lib/logos'
import { fadeUp, sectionSwap, stagger, viewport } from '../lib/motion'
import { useTheme } from '../theme/context'
import { Graphic, Mockups, Creatives } from './expression'
import { Favicon, Guidelines, Icon, Logo } from './identity'
import { LogoBanner } from './LogoBanner'
import { Palette, Typography, Voice } from './system'

const modules = [
  { id: 'logo', C: Logo },
  { id: 'guidelines', C: Guidelines },
  { id: 'icon', C: Icon },
  { id: 'favicon', C: Favicon },
  { id: 'palette', C: Palette },
  { id: 'type', C: Typography },
  { id: 'voice', C: Voice },
  { id: 'graphic', C: Graphic },
  { id: 'mockups', C: Mockups },
  { id: 'creatives', C: Creatives },
  { id: 'banner', C: LogoBanner },
]

export function BrandKit() {
  const { concept, mode } = useTheme()
  return (
    <section id="kit">
      {/* The kit opens on a band in the hero colour, a chapter title for the selected concept. */}
      <div className="guides guides-hero bg-hero pt-section pb-module text-hero-ink">
        <div className="container-x">
          <AnimatePresence mode="wait">
            <motion.div key={concept.id} variants={sectionSwap} initial="initial" animate="animate" exit="exit">
              <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
                <div>
                  <SectionEyebrow index="02" onHero>
                    Brand kit · Concept {concept.index}
                  </SectionEyebrow>
                  <h2 className="display mt-6 text-kit">{concept.name}</h2>
                  <ScrollRevealText text={concept.story} className="mt-6 max-w-[40ch] text-lead-xl font-medium text-pretty" />
                </div>
                <figure className="relative flex w-full flex-col gap-4 rounded-brand-lg bg-surface p-4 text-ink shadow-soft sm:w-[420px]">
                  <div className="grid aspect-[4/3] place-items-center rounded-brand-md bg-bg">
                    <img src={logoUrl(concept.id, 'primary', mode)} alt={`ONE Agency ${concept.name} logo`} className="max-h-[62%] w-auto max-w-[80%] object-contain" />
                  </div>
                  <figcaption className="flex items-center justify-between gap-4 px-1 pb-1">
                    <span className="label text-muted">{concept.type.display.family}</span>
                    <PaletteBar c={concept} className="h-2 w-28" />
                  </figcaption>
                </figure>
              </div>
              <motion.dl variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport} className="mt-module grid gap-2 md:grid-cols-3">
                {concept.rationale.map((r, i) => (
                  <motion.div
                    key={r.title}
                    variants={fadeUp}
                    className="relative isolate flex min-h-[240px] flex-col justify-end overflow-hidden rounded-brand-lg bg-hero-ink/[0.05] p-6 ring-1 ring-hero-ink/10 ring-inset"
                  >
                    <GhostNumber className="-z-10 opacity-[0.09]">{String(i + 1).padStart(2, '0')}</GhostNumber>
                    <CornerTicks />
                    <dt className="font-shell text-xl font-semibold tracking-tight">{r.title}</dt>
                    <dd className="mt-2 max-w-[42ch] text-hero-ink/75 text-pretty">{r.body}</dd>
                  </motion.div>
                ))}
              </motion.dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="guides">
        {/* Remount per concept, under the wipe, so every module starts fresh and replays its entrance for the new concept. */}
        <div className="kit-modules container-x">
          <AnimatePresence mode="wait">
            <motion.div key={concept.id} variants={sectionSwap} initial="initial" animate="animate" exit="exit">
              {modules.map((m) => (
                <m.C key={m.id} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
