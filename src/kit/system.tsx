import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Minus, Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { company, monoStack } from '../data/concepts'
import type { MockupPhoto } from '../data/mockups'
import { cmyk, contrast, inkOn, readableAlpha, rgbString } from '../lib/color'
import { conceal, duration, ease, fadeUp, reveal, stagger, viewport } from '../lib/motion'
import { focusOf, photoLayoutId, photosOf } from '../lib/photos'
import { useTheme } from '../theme/context'
import { KitModule, Tile } from './KitModule'
import { Lightbox } from './Lightbox'
import { PhotoTile } from './PhotoTile'

/**
 * Colour as a board of equal columns: each colour's name set tall, its values beneath, and at the foot the photograph
 * the colour is drawn from. Hover, focus or tap a column to widen it and read its full spec; leaving the board settles
 * every column back to the same width.
 */
export function Palette() {
  const { concept: c } = useTheme()
  const reduce = useReducedMotion()
  const swatches = c.palette
  const [active, setActive] = useState<number | null>(null)
  const { light, dark } = c.theme
  const stops = c.gradient.match(/#[0-9A-F]{6}/gi) ?? []
  const pairings = [
    { name: 'Ink on white', fg: light.ink, bg: light.bg },
    { name: 'On accent', fg: light.accentInk, bg: light.accent },
    { name: 'Reversed', fg: dark.heroInk, bg: dark.heroBg },
    { name: 'Accent on dark', fg: dark.accentText, bg: dark.heroBg },
  ]
  return (
    <KitModule id="palette" title="Colour palette" intro="Every colour has a clear job. Hover or tap a colour to open its full values and see where it is used.">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="flex h-[min(640px,88vh)] flex-col overflow-hidden rounded-brand-md shadow-soft sm:h-[clamp(520px,62vw,640px)] sm:flex-row"
        onMouseLeave={() => setActive(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null)
        }}
      >
        {swatches.map((s, i) => {
          const open = active === i
          const ink = inkOn(s.hex)
          // The 11px spec lines are small text: soft where they still clear 4.5:1, firmer on mid-tones like violet.
          const keyAlpha = readableAlpha(ink, s.hex, 0.6)
          const specAlpha = readableAlpha(ink, s.hex, 0.7)
          return (
            <motion.button
              key={s.hex}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(open ? null : i)}
              aria-expanded={open}
              aria-label={`${s.name}, ${s.hex}. ${s.role}`}
              className="relative flex min-h-0 min-w-0 basis-0 cursor-default flex-row overflow-hidden text-left outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-inset sm:flex-col"
              style={{ background: s.hex, color: ink }}
              initial={false}
              // Equal columns at rest. A tween, not a spring: springing widths made neighbours wobble as the pointer swept across.
              animate={{ flexGrow: open ? 2.4 : 1 }}
              transition={reduce ? { duration: 0 } : { duration: duration.component, ease: ease.out }}
            >
              <span className="relative flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-5">
                {/* Read bottom to top on wide screens, set against the top edge like the board. */}
                <span className="font-shell text-[clamp(1.6rem,3.4vw,3.25rem)] leading-none font-semibold tracking-tight whitespace-nowrap sm:min-h-0 sm:flex-1 sm:overflow-hidden sm:text-end sm:[writing-mode:vertical-rl] sm:rotate-180">
                  {s.name}
                </span>
                <span className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px] leading-snug whitespace-nowrap sm:mt-6">
                  <span style={{ opacity: keyAlpha }}>HEX</span>
                  <span style={{ opacity: keyAlpha > 0.6 ? 1 : 0.9 }}>{s.hex}</span>
                  <span style={{ opacity: keyAlpha }}>RGB</span>
                  <span style={{ opacity: keyAlpha > 0.6 ? 1 : 0.9 }}>{rgbString(s.hex).replace(/ /g, ', ')}</span>
                </span>
                {/* Stays mounted and crossfades, so sweeping the pointer never pops text in and out. */}
                <motion.span
                  aria-hidden={!open}
                  className="pointer-events-none mt-3 flex flex-col gap-1 sm:absolute sm:top-5 sm:right-5 sm:left-[calc(clamp(1.6rem,3.4vw,3.25rem)+2.5rem)] sm:mt-0"
                  initial={false}
                  animate={open ? { opacity: 1, y: 0, transition: reveal } : { opacity: 0, y: 8, transition: conceal }}
                >
                  <span className="font-mono text-[11px]" style={{ opacity: specAlpha }}>
                    CMYK {cmyk(s.hex)}
                  </span>
                  <span className="font-mono text-[11px]" style={{ opacity: specAlpha }}>
                    {s.share}% of a layout
                  </span>
                  <span className="mt-2 max-w-[26ch] text-sm leading-snug opacity-90">{s.role}</span>
                </motion.span>
              </span>

              <SwatchPhoto hex={s.hex} id={s.photo} open={open} />
            </motion.button>
          )
        })}
      </motion.div>

      <Tile dark={false} label="Brand gradient" className="mt-3 h-36" style={{ background: c.gradient }}>
        <div className="absolute right-4 bottom-4 flex gap-2">
          {stops.map((h) => (
            <span key={h} className="rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ background: h, color: inkOn(h), boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}>
              {h}
            </span>
          ))}
        </div>
      </Tile>

      <motion.ul variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={viewport} className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {pairings.map((p) => {
          const r = contrast(p.fg, p.bg)
          return (
            <motion.li
              key={p.name}
              variants={fadeUp}
              className="flex aspect-[4/5] flex-col justify-between rounded-brand-md p-5 shadow-soft"
              style={{ background: p.bg, color: p.fg }}
            >
              <span className="text-[clamp(3rem,6vw,4.5rem)] leading-none" style={{ fontFamily: c.type.display.stack, fontWeight: c.type.display.weight, fontStretch: c.type.display.stretch }}>
                Aa
              </span>
              <span>
                <span className="block text-sm font-semibold">{p.name}</span>
                <span className="label mt-1 block text-[10px]" style={{ opacity: readableAlpha(p.fg, p.bg, 0.7) }}>
                  {r.toFixed(1)}:1 · {r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'AA large'}
                </span>
              </span>
            </motion.li>
          )
        })}
      </motion.ul>
    </KitModule>
  )
}

/**
 * The photograph a swatch is drawn from. The swatch colour stands in while it loads, and stays if the file is missing,
 * so the column never shows a broken image. Opening the column eases the photo in slightly, for feedback.
 */
function SwatchPhoto({ hex, id, open }: { hex: string; id: string; open: boolean }) {
  const reduce = useReducedMotion()
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  return (
    <span aria-hidden className="relative w-2/5 shrink-0 overflow-hidden sm:h-[30%] sm:w-full" style={{ background: hex }}>
      {state !== 'failed' && (
        <motion.img
          src={`/palette/${id}.webp`}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          className="absolute inset-0 size-full object-cover"
          initial={false}
          animate={{ opacity: state === 'ready' ? 1 : 0, scale: open && !reduce ? 1.06 : 1 }}
          transition={{ duration: duration.page, ease: ease.out }}
        />
      )}
    </span>
  )
}

/** Specimen rows split at the half-alphabet, so lines break where we choose rather than mid-run. */
const charRows = [
  { text: 'ABCDEFGHIJKLM' },
  { text: 'NOPQRSTUVWXYZ' },
  { text: 'abcdefghijklm', lower: true },
  { text: 'nopqrstuvwxyz', lower: true },
  { text: '0123456789' },
  { text: '&@%$+?!' },
]

export function Typography() {
  const { concept: c, mode } = useTheme()
  const d = c.type.display
  const b = c.type.body
  const { accent, accentInk } = c.theme[mode]
  // The display tile's 14px notes on the accent: 75% where that clears AA, firmer where it would not (Nova's violet).
  const noteAlpha = readableAlpha(accentInk, accent, 0.75)
  const dStyle = { fontFamily: d.stack, fontWeight: d.weight, fontStretch: d.stretch, letterSpacing: d.tracking }
  const scale = [
    { name: 'Display', size: 'clamp(2.6rem,6vw,4.6rem)', spec: '72 / 0.95', style: dStyle },
    { name: 'Heading 1', size: 'clamp(2rem,4vw,3rem)', spec: '48 / 1.0', style: dStyle },
    { name: 'Heading 2', size: '1.75rem', spec: '28 / 1.15', style: dStyle },
    { name: 'Body large', size: '1.25rem', spec: '20 / 1.5', style: { fontFamily: b.stack, fontWeight: b.weight } },
    { name: 'Body', size: '1rem', spec: '16 / 1.6', style: { fontFamily: b.stack, fontWeight: b.weight } },
    { name: 'Label', size: '0.75rem', spec: '12 / Sora, +6%', style: { fontFamily: monoStack, letterSpacing: '0.06em', textTransform: 'uppercase' as const } },
  ]
  return (
    <KitModule id="type" title="Typography" intro="One display face, one body face, one label face for data and captions. Body and label faces are free Google Fonts, so every team and vendor can use them.">
      <div className="grid gap-3 md:grid-cols-2">
        <Tile dark={false} label="Display" className="flex min-h-[340px] flex-col justify-between bg-accent p-6 pt-12 text-accent-ink">
          <span className="text-[clamp(6rem,14vw,10rem)] leading-[0.8]" style={dStyle}>
            Aa
          </span>
          <div>
            <p className="text-2xl font-semibold">{d.family}</p>
            <p className="text-sm" style={{ opacity: noteAlpha }}>
              {d.weights}
            </p>
            <p className="mt-2 text-sm" style={{ opacity: noteAlpha }}>
              {d.note}
            </p>
          </div>
        </Tile>
        <Tile label="Body" className="flex min-h-[340px] flex-col justify-between bg-surface p-6 pt-12">
          <p className="text-lg leading-relaxed" style={{ fontFamily: b.stack, fontWeight: b.weight }}>
            {company.about}
          </p>
          <div>
            <p className="text-2xl font-semibold" style={{ fontFamily: b.stack }}>
              {b.family}
            </p>
            <p className="text-sm text-muted">{b.weights}</p>
            <p className="mt-2 text-sm text-muted">{b.note}</p>
          </div>
        </Tile>
      </div>
      <Tile label="Character set" className="mt-3 bg-surface p-6 pt-12">
        <p className="text-[calc(clamp(1.4rem,3.2vw,2.4rem)*var(--f-display-scale))] leading-tight" style={dStyle}>
          {charRows
            .filter((row) => !(d.unicase && row.lower))
            .map((row) => (
              <span key={row.text} className="block break-all">
                {row.text}
              </span>
            ))}
        </p>
      </Tile>
      <Tile label="Type scale" className="mt-3 bg-surface p-6 pt-12">
        <ul>
          {scale.map((s) => (
            <li key={s.name} className="grid grid-cols-[110px_1fr] items-baseline gap-4 border-t border-line py-4 first:border-t-0 sm:grid-cols-[140px_1fr_auto]">
              <span className="label text-[10px] text-muted">{s.name}</span>
              <span className="truncate leading-none" style={{ ...s.style, fontSize: s.size }}>
                {s.name === 'Label' ? company.positioning : c.voice.samples[0].text}
              </span>
              <span className="hidden font-mono text-xs text-muted sm:block">{s.spec}</span>
            </li>
          ))}
        </ul>
      </Tile>
      <Tile label="Labels and data" className="mt-3 flex flex-wrap items-center justify-between gap-4 bg-surface p-6 pt-12">
        <span className="font-mono text-2xl">Sora</span>
        <span className="font-mono text-sm text-muted">[ 001 ] Capture · CPL $42.18 · 91 languages</span>
      </Tile>
    </KitModule>
  )
}

export function Voice() {
  const { concept: c } = useTheme()
  const mood = photosOf(c.id, ['art'])[0]
  return (
    <KitModule id="voice" title="Voice" intro="How the brand sounds in headlines, posts and conversations. Built on ONE Agency's plain-spoken, operator voice and tuned for this concept.">
      {/* The summary beside a mood image from tablets up, so the voice reads against the world it belongs to. */}
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className={mood ? 'grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : ''}
      >
        <motion.blockquote
          variants={fadeUp}
          className="rounded-brand-md bg-hero p-7 text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight font-semibold text-hero-ink sm:p-10"
          style={{ fontFamily: c.type.display.stack, fontStretch: c.type.display.stretch, letterSpacing: c.type.display.tracking }}
        >
          <span className="text-glow">“</span>
          {c.voice.summary}
          <span className="text-glow">”</span>
        </motion.blockquote>
        {mood && <MoodPhoto photo={mood} focus={focusOf(c.id, mood.slug)} />}
      </motion.div>
      <motion.ul variants={stagger(0.07)} initial="hidden" whileInView="show" viewport={viewport} className="mt-3 grid gap-3 md:grid-cols-3">
        {c.voice.traits.map((t, i) => (
          <motion.li key={t.name} variants={fadeUp} className="rounded-brand-md bg-surface p-6 shadow-soft">
            <span className="label text-accent-text">0{i + 1}</span>
            <p className="mt-3 font-shell text-2xl font-semibold">{t.name}</p>
            <p className="mt-2 text-sm text-muted">{t.body}</p>
          </motion.li>
        ))}
      </motion.ul>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Tile label="We say" className="bg-surface p-6 pt-12">
          <ul className="flex flex-col gap-3">
            {c.voice.say.map((s) => (
              <li key={s} className="flex gap-3">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                  <Plus size={12} weight="bold" />
                </span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ul>
        </Tile>
        <Tile label="We avoid" className="bg-surface p-6 pt-12">
          <ul className="flex flex-col gap-3">
            {c.voice.avoid.map((s) => (
              <li key={s} className="flex gap-3 text-muted">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-surface2">
                  <Minus size={12} weight="bold" />
                </span>
                {s}
              </li>
            ))}
          </ul>
        </Tile>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {c.voice.samples.map((s) => (
          <Tile key={s.label} label={s.label} className="flex min-h-[180px] items-end bg-surface2 p-6 pt-12">
            {s.label === 'CTA' ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-accent-ink">
                {s.text} <ArrowRight size={16} />
              </span>
            ) : (
              <p className={s.label === 'Headline' ? 'display text-[calc(1.9rem*var(--f-display-scale))]' : 'text-lg font-medium'}>{s.text}</p>
            )}
          </Tile>
        ))}
      </div>
    </KitModule>
  )
}

/**
 * The voice's mood image. It fills the height of the quote beside it and opens in the lightbox. That frame runs from
 * 16:10 on phones to roughly 0.7 portrait on tablets, so `focus` keeps each concept's subject in it.
 */
function MoodPhoto({ photo, focus }: { photo: MockupPhoto; focus: string }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState<number | null>(null)
  return (
    <motion.div variants={fadeUp} className="aspect-[16/10] min-w-0 md:aspect-auto md:min-h-72">
      <PhotoTile
        photo={photo}
        label="Mood"
        sizes="(min-width: 1024px) 34vw, (min-width: 768px) 46vw, 100vw"
        layoutId={reduce ? undefined : photoLayoutId('voice', photo.slug)}
        focus={focus}
        onOpen={() => setOpen(0)}
        className="size-full"
      />
      <Lightbox photos={[photo]} index={open} onIndex={setOpen} scope="voice" />
    </motion.div>
  )
}
