import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition } from 'motion/react'
import { useState } from 'react'
import { ArrowRight, ChatCircleDots, Check, CursorClick, DownloadSimple, Funnel, Repeat, Target, TrendUp } from '@phosphor-icons/react'
import { company, type Concept, type ConceptId } from '../data/concepts'
import type { MockupKind, MockupPhoto } from '../data/mockups'
import { PORTRAIT_BELOW } from '../lib/bento'
import { inkOn, readableAlpha } from '../lib/color'
import { logoUrl, modeOn, wideLogo } from '../lib/logos'
import { ease, fadeUp, press, sectionSwap, stagger, viewport } from '../lib/motion'
import { kindLabel, photosOf, titleOf } from '../lib/photos'
import { displayStyle } from '../lib/type'
import { useTheme } from '../theme/context'
import { Deboss } from './Deboss'
import { KitModule, Tile } from './KitModule'
import { Lightbox } from './Lightbox'
import { Linework } from './Linework'
import { LogoReel } from './LogoReel'
import { Pattern } from './Pattern'
import { PhotoRows, type RowRules } from './PhotoTile'
import { Grain } from './Texture'

const stepIcons = [Target, ChatCircleDots, Funnel, Repeat, CursorClick, TrendUp]

/** Each concept's signature move for its mark, used as the motion reference. */
const signature: Record<ConceptId, TargetAndTransition> = {
  // The square corner swings round into the top right and the O settles.
  nova: { rotate: [-90, 6, 0, 0], scale: [0.6, 1.06, 1, 1], transition: { duration: 2.2, times: [0, 0.4, 0.55, 1], ease: ease.out, repeat: Infinity, repeatDelay: 0.8 } },
  volt: { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0 0 100%)'], transition: { duration: 2.4, times: [0, 0.3, 0.75, 1], ease: ease.emphasized, repeat: Infinity, repeatDelay: 0.4 } },
  arc: { y: ['60%', '0%', '0%', '-8%'], opacity: [0, 1, 1, 0], transition: { duration: 2.6, times: [0, 0.35, 0.8, 1], ease: ease.out, repeat: Infinity, repeatDelay: 0.3 } },
  pill: { scaleX: [0.3, 1.08, 1], transition: { duration: 1.4, ease: ease.out, repeat: Infinity, repeatType: 'mirror', repeatDelay: 0.8 } },
}

export function Graphic() {
  const { concept: c, mode } = useTheme()
  const reduce = useReducedMotion()
  const { light, dark } = c.theme
  const t = c.theme[mode]
  const live = !reduce
  return (
    <KitModule id="graphic" title="Graphic language" intro={c.graphic.body}>
      <Tile dark label={`${c.graphic.name} · live`} className="aspect-[16/9]">
        <Pattern c={c} animated className="absolute inset-0 size-full" />
        <Grain opacity={0.28} />
      </Tile>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Tile dark={false} label="Supergraphic" className="aspect-square" style={{ background: light.accent }}>
          <img src={logoUrl(c.id, 'mark', modeOn(light.accent))} alt="" className="absolute -right-[30%] -bottom-[25%] h-[120%] w-auto max-w-none" />
          <Grain opacity={0.35} blend="multiply" live={false} />
        </Tile>
        <Tile dark={false} label="Gradient" className="aspect-square">
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{ backgroundImage: c.gradient, backgroundSize: '220% 220%' }}
            animate={live ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : undefined}
            transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          />
          <Grain opacity={0.45} blend="soft-light" />
          <span className="absolute bottom-6 left-6 text-4xl leading-none" style={{ ...displayStyle(c), color: inkOn(c.gradient.match(/#[0-9A-F]{6}/i)![0]) }}>
            {c.name}
          </span>
        </Tile>
        <Tile label="Principles" className="flex aspect-square flex-col justify-end gap-3 bg-surface p-6">
          {c.graphic.principles.map((p, i) => (
            <p key={p} className="flex gap-3 border-t border-line pt-3 text-sm font-medium">
              <span className="font-mono text-accent-text">0{i + 1}</span>
              {p}
            </p>
          ))}
        </Tile>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Tile label="Texture · linework" className="aspect-[4/3]" style={{ background: dark.heroBg }} dark>
          <Linework c={c} className="absolute inset-0 size-full" />
        </Tile>
        <Tile label="Texture · deboss" className="aspect-[4/3]" style={{ background: t.surface }}>
          <Deboss c={c} mode={mode} className="absolute inset-0 size-full" />
        </Tile>
        <Tile label="Motion · signature" className="grid aspect-[4/3] place-items-center overflow-hidden" style={{ background: dark.heroBg }} dark>
          <motion.img
            key={c.id}
            src={logoUrl(c.id, 'mark', 'dark')}
            alt={`${c.name} mark motion signature`}
            className="h-[42%] w-auto max-w-[60%]"
            animate={live ? signature[c.id] : undefined}
          />
          <Grain opacity={0.22} />
        </Tile>
      </div>

      <KeyVisuals c={c} />

      <Tile label="Iconography · the six steps" className="mt-3 bg-surface p-5 pt-12">
        <motion.ul variants={stagger(0.05)} initial="hidden" whileInView="show" viewport={viewport} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {company.steps.map((s, i) => {
            const I = stepIcons[i]
            return (
              <motion.li key={s} variants={fadeUp} className="flex flex-col items-center gap-2 rounded-brand-sm bg-surface2 p-4">
                <span className="grid size-12 place-items-center rounded-brand-sm bg-accent text-accent-ink">
                  <I size={24} weight="duotone" />
                </span>
                <span className="text-xs font-medium">{s}</span>
              </motion.li>
            )
          })}
        </motion.ul>
      </Tile>
    </KitModule>
  )
}

/**
 * The concept's key visuals: its art photos after the first, which is the Voice mood image. Justified rows at each
 * photo's own ratio, like the campaign row: stacked on phones, paired from 640px, one row from 1024px. Concepts with a
 * single art photo show none here.
 */
function KeyVisuals({ c }: { c: Concept }) {
  const [open, setOpen] = useState<number | null>(null)
  const photos = photosOf(c.id, ['art']).slice(1)
  if (!photos.length) return null
  const total = photos.reduce((sum, p) => sum + p.width / p.height, 0)
  const rules: RowRules = { base: { target: 1, max: 0 }, sm: { target: 3.6, max: 3.7 }, lg: { target: total } }
  return (
    <div className="mt-3">
      <PhotoRows photos={photos} rules={rules} scope="graphic" label={(p) => `Key visual · ${titleOf(p)}`} onOpen={setOpen} />
      <Lightbox photos={photos} index={open} onIndex={setOpen} scope="graphic" />
    </div>
  )
}

/**
 * Photo kinds the Mockups gallery shows. Social photos sit under Digital creatives; the first art photo sits beside
 * Voice and the rest are key visuals under Graphic language.
 */
const galleryKinds: MockupKind[] = ['environment', 'print', 'merch', 'poster']

export function Mockups() {
  const { concept: c } = useTheme()
  return (
    <KitModule
      id="mockups"
      title="Mockups"
      intro="The identity out in the world: reception walls, event stands, print, merch and posters. Open any photo to see it full size."
      wide
    >
      <AnimatePresence mode="wait" initial={false}>
        <MockupGallery key={c.id} c={c} />
      </AnimatePresence>
    </KitModule>
  )
}

/** Hero first, then portraits, so the portraits share the opening row with the hero on desktop and lift its height. */
function galleryOrder(photos: MockupPhoto[]) {
  const [hero, ...rest] = photos
  if (!hero) return []
  const portrait = (p: MockupPhoto) => p.width / p.height < PORTRAIT_BELOW
  return [hero, ...rest.filter(portrait), ...rest.filter((p) => !portrait(p))]
}

/**
 * Row targets as summed aspect ratios. Phones and tablets: the hero alone, then about two landscapes a row (about
 * 110px tall at 375px, 210px at 768px), never so many that a row drops under about 90px. Desktop: a larger opening row
 * (hero plus one landscape or two portraits, about 330 to 380px tall at 1280px), then about three a row (about 230px).
 */
const galleryRows: RowRules = {
  base: { first: 1.8, target: 3, max: 3.7 },
  lg: { first: 3, target: 4.5, max: 6.5 },
}

function MockupGallery({ c }: { c: Concept }) {
  const [open, setOpen] = useState<number | null>(null)
  const photos = galleryOrder(photosOf(c.id, galleryKinds))
  return (
    <motion.div variants={sectionSwap} initial="initial" animate="animate" exit="exit">
      {photos.length ? (
        <PhotoRows photos={photos} rules={galleryRows} scope="mockups" label={(p) => kindLabel[p.kind]} onOpen={setOpen} />
      ) : (
        <p className="rounded-brand-md bg-surface p-8 text-muted shadow-soft">Photo mockups for this concept are on their way.</p>
      )}
      <Lightbox photos={photos} index={open} onIndex={setOpen} scope="mockups" />
    </motion.div>
  )
}

/** 1fr : 9/16fr : 9/16fr from 1024px, shared by the templates and the campaign row under them. */
const CREATIVE_COLUMNS = 'lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5625fr)_minmax(0,0.5625fr)]'

/** A lone campaign photo's share of the row from 1024px: the post and story columns plus a gap, as the banner spans. */
const LONE_SPAN = 1.5625 / 2.125

export function Creatives() {
  const { concept: c, mode } = useTheme()
  const { light, dark } = c.theme
  const t = c.theme[mode]
  const story = light.accent
  const storyInk = light.accentInk
  return (
    <KitModule id="creatives" title="Digital creatives" intro="Launch-ready templates for social and paid media, written in this concept's voice and built from its tokens." wide>
      {/* 1fr : 9/16fr : 9/16fr makes the square and both 9:16 tiles exactly the same height, so the row ends flush. */}
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${CREATIVE_COLUMNS}`}>
        <Tile dark label="Instagram post · 1:1" className="aspect-square sm:col-span-2 lg:col-span-1" style={{ background: dark.heroBg }}>
          <Pattern c={c} className="absolute inset-0 size-full opacity-60" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${dark.heroBg}00 20%, ${dark.heroBg} 78%)` }} />
          <div className="absolute inset-0 flex flex-col justify-end gap-4 p-[7%]" style={{ color: dark.heroInk }}>
            <p className="text-[clamp(1.5rem,4.2vw,3.2rem)] leading-[0.95]" style={displayStyle(c)}>
              We capture intent. Then we convert it.
            </p>
            <div className="flex items-center justify-between">
              <img src={logoUrl(c.id, wideLogo(c.id), 'dark')} alt="" className="h-[clamp(14px,2vw,22px)] w-auto" />
              <span className="label text-[10px] opacity-60">@oneagency</span>
            </div>
          </div>
        </Tile>
        <Tile dark={false} label="Story · 9:16" className="aspect-[9/16]" style={{ background: story, color: storyInk }}>
          <div className="absolute inset-0 flex flex-col p-[9%] pt-14">
            <img src={logoUrl(c.id, 'mark', modeOn(story))} alt="" className="h-9 w-auto self-start" />
            <p className="mt-auto label text-[10px]" style={{ opacity: readableAlpha(storyInk, story, 0.7) }}>
              Free ChattiBiz Growth Audit
            </p>
            <p className="mt-2 text-[clamp(1.6rem,3.6vw,2.6rem)] leading-[0.95]" style={displayStyle(c)}>
              Results in 5 minutes.
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-sm font-medium">
              {['AI search scan', 'SEO audit', 'Reviews audit', 'Website CRO audit'].map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <Check size={14} weight="bold" /> {a}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold" style={{ background: storyInk, color: story }}>
              Run my audit <ArrowRight size={14} />
            </span>
          </div>
        </Tile>
        <LogoReelTile c={c} />
        {/* Second row reuses the same columns: the banner spans the post and story, the ad sits under the reel. */}
        <Tile label="LinkedIn banner · 4:1" className="h-[clamp(150px,40vw,220px)] sm:col-span-2 lg:h-auto" style={{ background: t.surface }}>
          <div className="absolute inset-0 flex items-center gap-[5%] pr-[34%] pl-[5%] pt-6">
            <img src={logoUrl(c.id, 'primary', mode)} alt="" className="h-[42%] max-h-24 w-auto max-w-[45%]" />
            <p className="text-[clamp(0.85rem,1.6vw,1.25rem)] leading-tight font-semibold" style={{ color: t.ink }}>
              {company.positioning}
            </p>
          </div>
          <Pattern c={c} className="absolute inset-y-0 right-0 h-full w-[30%]" />
        </Tile>
        <Tile dark label="Display ad · 300×250" className="aspect-[6/5] sm:col-span-2 sm:aspect-[2/1] lg:col-span-1 lg:aspect-[6/5]" style={{ background: dark.heroBg, color: dark.heroInk }}>
          <div className="absolute inset-0 flex flex-col justify-between p-[8%] pt-12">
            <div>
              <p className="text-[clamp(2.6rem,6vw,4.4rem)] leading-none" style={{ ...displayStyle(c), color: dark.accentText }}>
                80k+
              </p>
              <p className="mt-2 max-w-[22ch] text-sm opacity-80">leads delivered for vacation ownership brands</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap" style={{ background: dark.accent, color: dark.accentInk }}>
                See the work <ArrowRight size={13} />
              </span>
              <img src={logoUrl(c.id, 'mark', 'dark')} alt="" className="h-8 w-auto" />
            </div>
          </div>
        </Tile>
      </div>
      <CampaignRow c={c} />
    </KitModule>
  )
}

/**
 * The concept's social campaign photos in justified rows, each at its own aspect ratio so no logo or headline is
 * cropped. Phones stack them. From 640px they pair up, so three photos never shrink to a 120px strip on a small tablet.
 * From 1024px they share one row; a lone photo spans the post and story columns instead, left aligned under the banner,
 * so it sits about as tall as the templates rather than running full width at nearly 800px.
 */
function CampaignRow({ c }: { c: Concept }) {
  const [open, setOpen] = useState<number | null>(null)
  const photos = photosOf(c.id, ['social'])
  if (!photos.length) return null
  const lone = photos.length === 1
  const total = photos.reduce((sum, p) => sum + p.width / p.height, 0)
  const rules: RowRules = { base: { target: 1, max: 0 }, sm: { target: 2.6, max: 3.7 }, lg: { target: total } }
  return (
    <div className={`mt-3 grid grid-cols-1 gap-3 ${CREATIVE_COLUMNS}`}>
      <PhotoRows
        photos={photos}
        rules={rules}
        scope="creatives"
        label={(p) => `Campaign · ${titleOf(p)}`}
        onOpen={setOpen}
        lgWidth={lone ? LONE_SPAN : 1}
        className={lone ? 'lg:col-span-2' : 'lg:col-span-full'}
      />
      <Lightbox photos={photos} index={open} onIndex={setOpen} scope="creatives" />
    </div>
  )
}

/** The 9:16 logo reel, sized to sit beside the Story tile, with its GIF download as a corner control. */
function LogoReelTile({ c }: { c: Concept }) {
  return (
    // Light chip: the reel cuts between dark and light scenes, and a white chip reads on both.
    <Tile dark={false} label="Logo reel · GIF" className="aspect-[9/16]" style={{ background: c.theme.dark.heroBg }}>
      <LogoReel c={c} />
      <motion.a
        {...press}
        href={`${import.meta.env.BASE_URL}reels/${c.id}.gif`}
        download={`one-agency-${c.id}-logo-reel.gif`}
        aria-label={`Download the ${c.name} logo reel as a GIF`}
        title="Download GIF"
        className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full bg-black/50 text-white ring-1 ring-white/25 backdrop-blur transition-colors ring-inset hover:bg-black/70 focus-visible:shadow-[0_0_0_6px_rgb(0_0_0/0.7)] focus-visible:outline-white"
      >
        <DownloadSimple size={18} weight="bold" aria-hidden />
      </motion.a>
    </Tile>
  )
}
