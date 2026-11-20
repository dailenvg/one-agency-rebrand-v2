import {
  BezierCurve,
  Browser,
  Camera,
  ChartLineUp,
  ChatCircleDots,
  CheckCircle,
  Circle,
  CursorClick,
  Funnel,
  ImageSquare,
  LockSimple,
  Megaphone,
  PenNib,
  Repeat,
  Swatches,
  Target,
  TextAa,
  TrendUp,
  type Icon,
} from '@phosphor-icons/react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { useId, useMemo } from 'react'
import { company, type Concept } from '../../data/concepts'
import { luminance } from '../../lib/color'
import { logoUrl, wideLogo } from '../../lib/logos'
import { reel } from '../../lib/motion'
import { displayStyle } from '../../lib/type'
import { Pattern } from '../Pattern'
import { Grain } from '../Texture'
import { mix, range, softShadow, useDrift, useSettle, type SceneProps } from './scene-kit'
import { centred, extraWidth, ICON_RADIUS, isWide, MARK, PLATE, STAGE, useStage, type Stage } from './stage'

/* Skyline: stylised towers against a glow, standing in for a photo backdrop. */

const TOWERS = [
  { w: 40, h: 150 }, { w: 28, h: 210 }, { w: 46, h: 120 }, { w: 32, h: 250 }, { w: 38, h: 170 },
  { w: 26, h: 130 }, { w: 44, h: 230 }, { w: 30, h: 160 }, { w: 36, h: 200 }, { w: 44, h: 140 },
]
const WINDOW = { w: 3, h: 4, col: 8, row: 12, inset: 6 }
/** Towers start this far below their resting line, so the skyline has room to rise. */
const RISE = 36
const GLOW = { d: 220, top: 400, spread: 0.5 }
const RUN = TOWERS.reduce((w, t) => w + t.w, 0)

/**
 * The towers for a stage. The 9:16 run sits where it always has, and wider stages add runs either side, mirrored
 * every other run and with their own lit windows, so the city extends without visibly tiling.
 */
function buildSkyline(s: Stage) {
  const origin = s.cx - STAGE.w / 2
  const runs = range(Math.ceil(origin / RUN) + Math.ceil((s.w - origin) / RUN)).map((i) => i - Math.ceil(origin / RUN))
  const towers = runs.flatMap((k) => {
    const order = Math.abs(k) % 2 ? [...TOWERS].reverse() : TOWERS
    // 0 for the original run, so its window scatter is unchanged; every other run gets its own.
    const seed = (k >= 0 ? 2 * k : -2 * k - 1) * TOWERS.length
    return order.map((t, j) => ({ ...t, x: origin + k * RUN + order.slice(0, j).reduce((x, o) => x + o.w, 0), i: seed + j }))
  })
  const windows = towers.flatMap((t) => {
    const cols = Math.floor((t.w - WINDOW.inset * 2) / WINDOW.col) + 1
    const rows = Math.floor((t.h - WINDOW.inset * 2) / WINDOW.row)
    return Array.from({ length: cols * rows }, (_, k) => ({ col: k % cols, row: Math.floor(k / cols) }))
      // A fixed scatter of lit windows, so the skyline never reshuffles.
      .filter(({ col, row }) => (t.i * 7 + col * 3 + row * 5) % 9 === 0)
      .map(({ col, row }) => ({ key: `${t.i}-${col}-${row}`, x: t.x + WINDOW.inset + col * WINDOW.col, y: s.h - t.h + WINDOW.inset + row * WINDOW.row }))
  })
  return { towers, windows }
}

function Skyline({ c, rise }: { c: Concept; rise?: MotionValue<number> }) {
  const { heroBg, glow, accent } = c.theme.dark
  const s = useStage()
  const { towers, windows } = useMemo(() => buildSkyline(s), [s])
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${heroBg} 0%, ${heroBg} 50%, ${mix(glow, 40, heroBg)} 82%, ${mix(glow, 65, heroBg)} 100%)` }}
      />
      <motion.div
        className="absolute rounded-full opacity-50 blur-3xl"
        style={{ ...centred(s, GLOW.d + extraWidth(s) * GLOW.spread, GLOW.d), top: GLOW.top, background: glow, y: rise }}
      />
      <motion.svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" style={{ y: rise }}>
        {towers.map((t) => (
          <rect key={t.i} x={t.x} y={s.h - t.h} width={t.w} height={t.h + RISE} style={{ fill: mix(heroBg, 70, 'black') }} />
        ))}
        {windows.map((w) => (
          <rect key={w.key} x={w.x} y={w.y} width={WINDOW.w} height={WINDOW.h} fill={accent} opacity={0.8} />
        ))}
      </motion.svg>
    </>
  )
}

export function SkylineScene({ c, p }: SceneProps) {
  const rise = useSettle(p, RISE, 0)
  return <Skyline c={c} rise={rise} />
}

/* App dock: a frosted dock slides up under the brand app tile, flanked by neutral tool tiles. On the 9:16 stage the
   dock runs off both edges; a wide stage holds a whole dock with more tools. */

const DOCK = { top: 316, height: 88, base: 396, travel: 72, bleed: 40, pad: 16, margin: 40, maxPerSide: 5 }
/** Tool tiles: the first sits `first` from the centre at the large size, the rest every `step` at the small size. */
const DOCK_SLOT = { first: 118, step: 68, large: 64, small: 52 }
/** Tools outward from the app tile on each side, the dark/light rhythm alternating. */
const DOCK_SIDES: { icons: Icon[]; darkFirst: boolean }[] = [
  { icons: [PenNib, BezierCurve, ImageSquare, Camera, Megaphone], darkFirst: false },
  { icons: [Swatches, TextAa, Browser, ChatCircleDots, ChartLineUp], darkFirst: true },
]

interface DockToolDef {
  Icon: Icon
  size: number
  x: number
  dark: boolean
}

/** Tools per side and the dock's half width. The 9:16 stage keeps two a side on a dock wider than the frame. */
function dockLayout(s: Stage) {
  const room = s.cx - DOCK.margin - DOCK.pad - DOCK_SLOT.small / 2 - DOCK_SLOT.first
  const perSide = isWide(s) ? Math.min(DOCK.maxPerSide, Math.floor(room / DOCK_SLOT.step) + 1) : 2
  const half = isWide(s) ? DOCK_SLOT.first + (perSide - 1) * DOCK_SLOT.step + DOCK_SLOT.small / 2 + DOCK.pad : s.cx + DOCK.bleed
  const tools: DockToolDef[] = DOCK_SIDES.flatMap(({ icons, darkFirst }, side) =>
    range(perSide).map((k) => {
      const size = k ? DOCK_SLOT.small : DOCK_SLOT.large
      const dx = (side ? 1 : -1) * (DOCK_SLOT.first + k * DOCK_SLOT.step)
      return { Icon: icons[k], size, x: s.cx + dx - size / 2, dark: darkFirst === (k % 2 === 0) }
    }),
  ).sort((a, b) => a.x - b.x)
  return { tools, half }
}

/** Stagger step for `count` tiles, so a long dock still settles within the scene. */
const dockStagger = (count: number) => reel.stagger * Math.min(1, 3 / (count - 1))

function DockTool({ c, p, tool, delay }: SceneProps & { tool: DockToolDef; delay: number }) {
  const y = useSettle(p, DOCK.travel, 0, delay)
  const { Icon, size, x, dark } = tool
  const t = dark ? c.theme.dark : c.theme.light
  return (
    <motion.span
      className="absolute grid place-items-center"
      style={{ left: x, top: DOCK.base - size, width: size, height: size, borderRadius: size * ICON_RADIUS, background: dark ? t.surface2 : t.bg, color: t.ink, y }}
    >
      <Icon size={size * 0.46} weight="duotone" />
    </motion.span>
  )
}

export function DockScene({ c, p }: SceneProps) {
  const s = useStage()
  const y = useSettle(p, DOCK.travel, 0)
  const opacity = useSettle(p, 0, 1)
  const { tools, half } = useMemo(() => dockLayout(s), [s])
  const step = dockStagger(tools.length)
  return (
    <>
      <div className="absolute inset-0 scale-110 blur-md">
        <Skyline c={c} />
      </div>
      <div className="absolute inset-0" style={{ background: mix(c.theme.dark.heroBg, 35) }} />
      <motion.div
        className="absolute rounded-[28px] bg-white/15 ring-1 ring-white/25 backdrop-blur-xl ring-inset"
        style={{ left: s.cx - half, width: half * 2, top: DOCK.top, height: DOCK.height, y, opacity }}
      />
      {tools.map((tool, i) => (
        <DockTool key={tool.x} c={c} p={p} tool={tool} delay={i * step} />
      ))}
      <motion.span className="absolute size-1 rounded-full" style={{ left: s.cx - 2, top: DOCK.base + 3, background: c.theme.dark.heroInk, opacity }} />
    </>
  )
}

/* Brand colour: the six steps drift past the mark on a full bleed of the accent. On the 9:16 stage they stack above
   and below it; a wide stage sets them on one line through it, read left to right. */

const STEP_ROWS = { gap: 56, clear: 88, drift: 18 }
/** The one-line layout: gap between words, drift, and a clear zone that keeps the drifting words off any mark. */
const STEP_LINE = { gap: 44, drift: 24, clear: MARK.w / 2 + 24 + 40 }
/** Opacity by distance from the mark, nearest first. */
const STEP_FADE = [1, 0.5, 0.22]
const stepFont = 'calc(30px * var(--x-scale))'
const half = company.steps.length / 2
/** How many steps away from the mark a step sits, on its side. */
const stepDistance = (i: number) => (i < half ? half - 1 - i : i - half)

export function StepsScene({ c, p }: SceneProps) {
  const { accent, accentInk } = c.theme.light
  const s = useStage()
  return (
    <div className="absolute inset-0" style={{ background: accent, color: accentInk }}>
      {isWide(s) ? <StepsLine c={c} p={p} /> : <StepsStack c={c} p={p} />}
    </div>
  )
}

function StepsStack({ c, p }: SceneProps) {
  const s = useStage()
  const y = useDrift(p, STEP_ROWS.drift, -STEP_ROWS.drift)
  return (
    <motion.div className="absolute inset-0" style={{ y }}>
      {company.steps.map((step, i) => {
        const above = i < half
        const distance = stepDistance(i)
        const offset = STEP_ROWS.clear + distance * STEP_ROWS.gap
        return (
          <p
            key={step}
            className="absolute inset-x-0 -translate-y-1/2 text-center leading-none whitespace-nowrap"
            style={{ ...displayStyle(c), top: s.cy + (above ? -offset : offset), fontSize: stepFont, opacity: STEP_FADE[distance] }}
          >
            {step}
          </p>
        )
      })}
    </motion.div>
  )
}

function StepsLine({ c, p }: SceneProps) {
  const s = useStage()
  const x = useDrift(p, STEP_LINE.drift, -STEP_LINE.drift)
  const sides = [company.steps.slice(0, half), company.steps.slice(half)]
  return (
    <motion.div className="absolute inset-x-0" style={{ top: s.cy, x }}>
      {sides.map((steps, side) => (
        <div
          key={steps[0]}
          className={`absolute top-0 flex -translate-y-1/2 items-center leading-none whitespace-nowrap ${side ? 'justify-start' : 'justify-end'}`}
          style={{ ...displayStyle(c), fontSize: stepFont, gap: STEP_LINE.gap, ...(side ? { left: s.cx + STEP_LINE.clear } : { right: s.cx + STEP_LINE.clear }) }}
        >
          {steps.map((step) => (
            <p key={step} style={{ opacity: STEP_FADE[stepDistance(company.steps.indexOf(step))] }}>
              {step}
            </p>
          ))}
        </div>
      ))}
    </motion.div>
  )
}

/* Guidelines: hairline crosshair and clear-space box through the mark, with a checklist above. */

const CHIPS = [
  { label: 'Logo', done: true },
  { label: 'Colour', done: true },
  { label: 'Typography', done: false },
]
const CLEAR = 12
/** The layout grid a wide stage shows behind the guides: columns, gutters and outer margin, in stage units. */
const LAYOUT_GRID = { columns: 12, gutter: 16, margin: 48, max: 1240, tint: 7 }

function Chip({ c, p, label, done, order }: SceneProps & (typeof CHIPS)[number] & { order: number }) {
  const { bg, ink, muted, accentText } = c.theme.light
  const delay = (order + 1) * reel.stagger
  const y = useSettle(p, 10, 0, delay)
  const opacity = useSettle(p, 0, 1, delay)
  const Mark = done ? CheckCircle : Circle
  return (
    <motion.span className="inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold" style={{ background: bg, color: ink, boxShadow: softShadow, y, opacity }}>
      <Mark size={13} weight={done ? 'fill' : 'regular'} color={done ? accentText : muted} />
      {label}
    </motion.span>
  )
}

/** Column bands of a page layout grid, centred on the mark, so a wide frame reads as a spec sheet. */
function LayoutGrid({ color, opacity }: { color: string; opacity: MotionValue<number> }) {
  const s = useStage()
  const width = Math.min(s.w - LAYOUT_GRID.margin * 2, LAYOUT_GRID.max)
  return (
    <motion.div
      className="absolute inset-y-0 grid"
      style={{ left: s.cx - width / 2, width, gridTemplateColumns: `repeat(${LAYOUT_GRID.columns}, 1fr)`, columnGap: LAYOUT_GRID.gutter, opacity }}
    >
      {range(LAYOUT_GRID.columns).map((i) => (
        <span key={i} style={{ background: mix(color, LAYOUT_GRID.tint) }} />
      ))}
    </motion.div>
  )
}

export function GuidesScene({ c, p }: SceneProps) {
  const { surface, bg, ink, accentText } = c.theme.light
  const s = useStage()
  const grow = useSettle(p, 0, 1)
  const box = centred(s, MARK.w + CLEAR * 2, MARK.h + CLEAR * 2)
  const corners = [
    [box.left, box.top],
    [box.left + box.width, box.top],
    [box.left, box.top + box.height],
    [box.left + box.width, box.top + box.height],
  ]
  return (
    <div className="absolute inset-0" style={{ background: surface, fontFamily: c.type.body.stack }}>
      {isWide(s) && <LayoutGrid color={accentText} opacity={grow} />}
      <motion.span className="absolute top-0 w-px opacity-60" style={{ left: s.cx, height: s.h, background: accentText, scaleY: grow }} />
      <motion.span className="absolute left-0 h-px opacity-60" style={{ top: s.cy, width: s.w, background: accentText, scaleX: grow }} />
      <motion.span className="absolute border border-dashed" style={{ ...box, borderColor: mix(ink, 35), opacity: grow }} />
      {corners.map(([x, y]) => (
        <motion.span key={`${x}-${y}`} className="absolute size-[7px] border" style={{ left: x - 3.5, top: y - 3.5, background: bg, borderColor: accentText, opacity: grow }} />
      ))}
      <div className="absolute inset-x-0 flex flex-col items-center gap-1.5" style={{ top: 132 }}>
        {CHIPS.map((chip, i) => (
          <Chip key={chip.label} c={c} p={p} {...chip} order={i} />
        ))}
      </div>
    </div>
  )
}

/* Website: a browser window rises under the mark, and the address types itself in below. A wide stage opens it out
   to a desktop window, with nav links and a row of feature cards. */

const BROWSER = { inset: 20, max: 660, top: 128, height: 380, bar: 34, travel: 28, maxRadius: 20 }
const URL_PILL = { top: 530, width: 196, height: 36 }
const NAV_LINKS = [44, 52, 38, 46]
const FEATURES = { top: 116, height: 58, inset: 24, gap: 12 }

export function WebScene({ c, p }: SceneProps) {
  const { bg, surface, surface2, ink, muted, accent, accent2 } = c.theme.light
  const s = useStage()
  const y = useSettle(p, BROWSER.travel, 0)
  const typed = useSettle(p, 100, 0, reel.stagger * 2)
  const features = useSettle(p, 0, 1, reel.stagger * 2)
  const clipPath = useTransform(typed, (v) => `inset(0 ${v}% 0 0)`)
  const body = s.cy - BROWSER.top
  const wide = isWide(s)
  const width = Math.min(s.w - BROWSER.inset * 2, BROWSER.max)
  return (
    <div className="absolute inset-0" style={{ background: surface2, fontFamily: c.type.body.stack }}>
      <motion.div
        className="absolute overflow-hidden"
        style={{ left: s.cx - width / 2, top: BROWSER.top, width, height: BROWSER.height, borderRadius: Math.min(c.radius.lg, BROWSER.maxRadius), background: bg, boxShadow: softShadow, y }}
      >
        <div className="flex items-center gap-1.5 px-3" style={{ height: BROWSER.bar, background: surface }}>
          {[accent, accent2, muted].map((dot) => (
            <span key={dot} className="size-[9px] rounded-full" style={{ background: dot }} />
          ))}
        </div>
        <div className="flex h-10 items-center justify-between px-4">
          <img src={logoUrl(c.id, wideLogo(c.id), 'light')} alt="" className="h-[13px] w-auto" />
          {wide && (
            <span className="flex gap-5">
              {NAV_LINKS.map((w) => (
                <span key={w} className="h-1.5 rounded-full" style={{ width: w, background: surface2 }} />
              ))}
            </span>
          )}
          <span className="h-4 w-11 rounded-full" style={{ background: accent }} />
        </div>
        <span className="absolute left-1/2 h-1.5 w-[150px] -translate-x-1/2 rounded-full" style={{ top: body + 70, background: surface2 }} />
        <span className="absolute left-1/2 h-1.5 w-[110px] -translate-x-1/2 rounded-full" style={{ top: body + 84, background: surface2 }} />
        {wide && (
          <motion.div
            className="absolute grid grid-cols-3"
            style={{ left: FEATURES.inset, right: FEATURES.inset, top: body + FEATURES.top, height: FEATURES.height, gap: FEATURES.gap, opacity: features }}
          >
            {[accent, accent2, muted].map((dot) => (
              <span key={dot} className="flex flex-col justify-center gap-1.5 rounded-[10px] px-3" style={{ background: surface }}>
                <span className="size-2.5 rounded-full" style={{ background: dot }} />
                <span className="h-1 w-3/4 rounded-full" style={{ background: surface2 }} />
                <span className="h-1 w-1/2 rounded-full" style={{ background: surface2 }} />
              </span>
            ))}
          </motion.div>
        )}
      </motion.div>
      <div
        className="absolute flex items-center justify-center gap-1.5 rounded-full text-[12px] font-medium"
        style={{ ...centred(s, URL_PILL.width, URL_PILL.height), top: URL_PILL.top, background: bg, color: ink, boxShadow: softShadow }}
      >
        <LockSimple size={12} weight="bold" color={muted} />
        <motion.span style={{ clipPath }}>oneagency.com</motion.span>
      </div>
    </div>
  )
}

/* Business card: the app tile on a card, with contact details either side. A wide stage fans the card's backs out
   either side of it, the pattern on one and the logo on the other. */

const CARD = { w: 336, h: 208, pad: 14, column: 72, maxRadius: 14, slide: 10 }
const TILT = { from: -2, to: -9 }
/** The flanking card backs: distance from the centre, resting tilt, and how far they slide in from outside. */
const BACKS = { offset: 392, tilt: 5, slide: 48 }

function CardBack({ c, p, side }: SceneProps & { side: -1 | 1 }) {
  const s = useStage()
  const { heroBg } = c.theme.dark
  const x = useSettle(p, side * BACKS.slide, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  const box = centred(s, CARD.w, CARD.h)
  return (
    <motion.div
      className="absolute grid place-items-center overflow-hidden"
      style={{ ...box, left: box.left + side * BACKS.offset, borderRadius: Math.min(c.radius.md, CARD.maxRadius), boxShadow: softShadow, background: heroBg, rotate: side * BACKS.tilt, x, opacity }}
    >
      {side < 0 ? <Pattern c={c} className="absolute inset-0 size-full" /> : <img src={logoUrl(c.id, 'primary', 'dark')} alt="" className="h-14 w-auto max-w-[70%]" />}
    </motion.div>
  )
}

export function CardScene({ c, p }: SceneProps) {
  const { surface, bg, ink, muted, accent } = c.theme.light
  const s = useStage()
  const tilt = useSettle(p, TILT.from, TILT.to)
  const left = useSettle(p, -CARD.slide, 0, reel.stagger)
  const right = useSettle(p, CARD.slide, 0, reel.stagger)
  const opacity = useSettle(p, 0, 1, reel.stagger)
  const card = { ...centred(s, CARD.w, CARD.h), borderRadius: Math.min(c.radius.md, CARD.maxRadius), boxShadow: softShadow }
  const [line1, line2] = company.positioning.split(' · ')
  return (
    <div className="absolute inset-0" style={{ background: surface, fontFamily: c.type.body.stack }}>
      {isWide(s) && <CardBack c={c} p={p} side={-1} />}
      {isWide(s) && <CardBack c={c} p={p} side={1} />}
      <motion.div className="absolute" style={{ ...card, background: accent, rotate: tilt }} />
      <div className="absolute" style={{ ...card, background: bg }}>
        <motion.div className="absolute inset-y-0 flex flex-col justify-center gap-1" style={{ left: CARD.pad, width: CARD.column, x: left, opacity }}>
          <p className="text-[9px] leading-tight font-semibold" style={{ color: ink }}>{company.name}</p>
          <p className="text-[7px] leading-snug" style={{ color: muted }}>
            {line1}
            <br />
            {line2}
          </p>
        </motion.div>
        <motion.div className="absolute inset-y-0 flex flex-col justify-center gap-0.5 text-right text-[7px] leading-snug" style={{ right: CARD.pad, width: CARD.column, color: muted, x: right, opacity }}>
          <p>{company.phone}</p>
          <p>oneagency.com</p>
          <p style={{ color: ink }}>@oneagency</p>
        </motion.div>
      </div>
    </div>
  )
}

/* Gradient: the brand gradient full bleed, split by a dark strip that holds the mark. */

const STRIP_FROM = 0.4

export function GradientScene({ c, p }: SceneProps) {
  const { heroBg } = c.theme.dark
  const s = useStage()
  const scaleY = useSettle(p, STRIP_FROM, 1)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: c.gradient }}>
      <Grain opacity={0.35} blend="soft-light" live={false} />
      <motion.div className="absolute" style={{ ...centred(s, PLATE.tile, s.h), background: `linear-gradient(180deg, ${mix(heroBg, 0)}, ${heroBg} 30%, ${heroBg} 70%, ${mix(heroBg, 0)})`, scaleY }} />
    </div>
  )
}

/* App profile: a phone with the pattern as its banner, the mark as the profile picture. A wide stage lays the pattern
   out either side of the phone, fading towards it, like the profile's own cover. */

const PHONE = { w: 240, h: 528, radius: 44, bezel: 6, banner: 170, travel: 36, tile: 70, gap: 4 }
const COVER = { opacity: 0.32, clear: 0.3 }

export function ProfileScene({ c, p }: SceneProps) {
  const { bg, surface, surface2, ink, muted, accent, heroBg } = c.theme.dark
  const s = useStage()
  const y = useSettle(p, PHONE.travel, 0)
  const cover = useSettle(p, 0, COVER.opacity)
  const phone = centred(s, PHONE.w, PHONE.h)
  const below = s.cy - phone.top + MARK.h / 2
  const posts = [c.gradient, accent, surface2, heroBg, c.gradient, accent]
  const fade = `linear-gradient(90deg, black, transparent ${COVER.clear * 100}%, transparent ${100 - COVER.clear * 100}%, black)`
  return (
    <div className="absolute inset-0" style={{ background: bg, fontFamily: c.type.body.stack }}>
      {isWide(s) && (
        <motion.div className="absolute inset-0" style={{ opacity: cover, maskImage: fade, WebkitMaskImage: fade }}>
          <Pattern c={c} className="absolute inset-0 size-full" />
        </motion.div>
      )}
      <motion.div
        className="absolute overflow-hidden"
        style={{ ...phone, y, borderRadius: PHONE.radius, background: surface, boxShadow: `0 0 0 ${PHONE.bezel}px ${surface2}, ${softShadow}` }}
      >
        <div className="absolute inset-x-0 top-0" style={{ height: PHONE.banner }}>
          <Pattern c={c} className="absolute inset-0 size-full" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${mix(surface, 0)} 40%, ${surface})` }} />
        </div>
        <span className="absolute top-2.5 left-1/2 h-5 w-[72px] -translate-x-1/2 rounded-full bg-black" />
        <div className="absolute inset-x-0 text-center" style={{ top: below + 14 }}>
          <p className="text-[14px] font-semibold" style={{ color: ink }}>{company.name}</p>
          <p className="text-[10px]" style={{ color: muted }}>oneagency.com</p>
        </div>
        <div className="absolute inset-x-0 flex justify-center gap-1" style={{ top: below + 58 }}>
          {company.steps.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full px-2 py-0.5 text-[8px] font-medium" style={{ background: surface2, color: ink }}>{s}</span>
          ))}
        </div>
        <div className="absolute inset-x-2.5 grid grid-cols-3" style={{ top: below + 88, gap: PHONE.gap }}>
          {posts.map((fill, i) => (
            <span key={i} className="aspect-square rounded-[6px]" style={{ background: fill }} />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* Construction: the name cut huge off-canvas, on a grid, with guides and anchor points around the mark. */

const GRID = 24
const GUIDE = { outer: 104, inner: 64, anchor: 6 }
const GIANT = { size: 260, drift: 28, gap: '0.35em', per: 400 }

/** The name cut huge, repeated on a wide stage so it still runs off both edges. */
function GiantName({ c, repeats }: { c: Concept; repeats: number }) {
  if (repeats === 1) return c.name
  return range(repeats).map((i) => (
    <span key={i} style={{ paddingRight: GIANT.gap }}>
      {c.name}
    </span>
  ))
}

export function ConstructionScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, accent } = c.theme.dark
  const s = useStage()
  const repeats = 1 + Math.ceil(extraWidth(s) / GIANT.per)
  const pathLength = useSettle(p, 0, 1)
  const top = useDrift(p, 0, -GIANT.drift)
  const bottom = useDrift(p, -GIANT.drift * 4, -GIANT.drift * 3)
  const faint = mix(heroInk, 9)
  const outline = mix(heroInk, 30)
  const giant = { ...displayStyle(c), fontSize: `calc(${GIANT.size}px * var(--x-scale))`, color: 'transparent', WebkitTextStroke: `1.2px ${outline}` }
  const box = centred(s, MARK.w, MARK.h)
  const { cx, cy } = s
  const anchors = [
    [box.left, box.top], [box.left + box.width, box.top], [box.left, box.top + box.height], [box.left + box.width, box.top + box.height],
    [cx, cy - GUIDE.outer], [cx, cy + GUIDE.outer], [cx - GUIDE.outer, cy], [cx + GUIDE.outer, cy],
  ]
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: heroBg,
        backgroundImage: `linear-gradient(${faint} 1px, transparent 1px), linear-gradient(90deg, ${faint} 1px, transparent 1px)`,
        backgroundSize: `${GRID}px ${GRID}px`,
        backgroundPosition: `${cx % GRID}px ${cy % GRID}px`,
      }}
    >
      <motion.p className="absolute left-0 leading-[0.9] whitespace-nowrap" style={{ ...giant, top: -40, x: top }}>
        <GiantName c={c} repeats={repeats} />
      </motion.p>
      <motion.p className="absolute left-0 leading-[0.9] whitespace-nowrap" style={{ ...giant, top: 440, x: bottom }}>
        <GiantName c={c} repeats={repeats} />
      </motion.p>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none">
        <line x1={0} y1={cy - cx} x2={s.w} y2={cy + cx} stroke={outline} strokeWidth={0.75} />
        <line x1={0} y1={cy + cx} x2={s.w} y2={cy - cx} stroke={outline} strokeWidth={0.75} />
        <circle cx={cx} cy={cy} r={GUIDE.inner} stroke={outline} strokeDasharray="3 4" />
        <motion.circle cx={cx} cy={cy} r={GUIDE.outer} stroke={accent} strokeWidth={1.2} transform={`rotate(-90 ${cx} ${cy})`} style={{ pathLength }} />
        {anchors.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - GUIDE.anchor / 2} y={y - GUIDE.anchor / 2} width={GUIDE.anchor} height={GUIDE.anchor} fill={heroBg} stroke={accent} />
        ))}
      </svg>
    </div>
  )
}

/* Story ring: the closing card. A gradient ring draws round the avatar, the handle and highlights settle in. */

const RING = { r: 98, stroke: 5 }
/** Gradient stops darker than this vanish on a dark profile, so the ring skips them. */
const MIN_RING_LUMINANCE = 0.02
/** One highlight per step. The 9:16 stage shows the first three under the ring; a wide stage flanks it with all six. */
const HIGHLIGHTS: Icon[] = [Target, ChatCircleDots, Funnel, Repeat, CursorClick, TrendUp]
const PORTRAIT_HIGHLIGHTS = 3
/** Gap between the ring and the highlights beside it on a wide stage. */
const FLANK = 48

function ringStops(c: Concept) {
  const stops = (c.gradient.match(/#[0-9A-F]{6}/gi) ?? []).filter((hex) => luminance(hex) > MIN_RING_LUMINANCE)
  return stops.length > 1 ? stops : [c.theme.dark.accent, c.theme.dark.accent2]
}

function Highlight({ c, p, Icon, label, order }: SceneProps & { Icon: Icon; label: string; order: number }) {
  const { surface2, ink, muted, line } = c.theme.dark
  const delay = (order + 3) * reel.stagger
  const y = useSettle(p, 12, 0, delay)
  const opacity = useSettle(p, 0, 1, delay)
  return (
    <motion.div className="flex w-16 flex-col items-center gap-1.5" style={{ y, opacity }}>
      <span className="grid size-12 place-items-center rounded-full" style={{ background: surface2, color: ink, boxShadow: `0 0 0 2px ${line}` }}>
        <Icon size={18} weight="duotone" />
      </span>
      <span className="text-[9px]" style={{ color: muted }}>{label}</span>
    </motion.div>
  )
}

export function StoryScene({ c, p }: SceneProps) {
  const { bg, ink, muted } = c.theme.dark
  const s = useStage()
  const { cx, cy } = s
  const id = `ring-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const pathLength = useSettle(p, 0, 1)
  const y = useSettle(p, 14, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  const stops = ringStops(c)
  return (
    <div className="absolute inset-0" style={{ background: bg, fontFamily: c.type.body.stack }}>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none">
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            {stops.map((stop, i) => (
              <stop key={stop} offset={i / (stops.length - 1)} stopColor={stop} />
            ))}
          </linearGradient>
        </defs>
        <motion.circle
          cx={cx}
          cy={cy}
          r={RING.r}
          stroke={`url(#${id})`}
          strokeWidth={RING.stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ pathLength }}
        />
      </svg>
      <motion.div className="absolute inset-x-0 text-center" style={{ top: cy + RING.r + 22, y, opacity }}>
        <p className="text-[16px] font-semibold" style={{ color: ink }}>@oneagency</p>
        <p className="mt-0.5 text-[10px]" style={{ color: muted }}>{company.positioning}</p>
      </motion.div>
      {isWide(s) ? (
        [0, 1].map((side) => (
          <div
            key={side}
            className="absolute flex -translate-y-1/2 gap-3"
            style={{ top: cy, ...(side ? { left: cx + RING.r + FLANK } : { right: cx + RING.r + FLANK }) }}
          >
            {HIGHLIGHTS.slice(side * PORTRAIT_HIGHLIGHTS, (side + 1) * PORTRAIT_HIGHLIGHTS).map((Icon, k) => {
              const i = side * PORTRAIT_HIGHLIGHTS + k
              // Nearest the ring settles first on both sides.
              const order = side ? k : PORTRAIT_HIGHLIGHTS - 1 - k
              return <Highlight key={company.steps[i]} c={c} p={p} Icon={Icon} label={company.steps[i]} order={order} />
            })}
          </div>
        ))
      ) : (
        <div className="absolute inset-x-0 flex justify-center gap-3" style={{ top: cy + RING.r + 84 }}>
          {HIGHLIGHTS.slice(0, PORTRAIT_HIGHLIGHTS).map((Icon, i) => (
            <Highlight key={company.steps[i]} c={c} p={p} Icon={Icon} label={company.steps[i]} order={i} />
          ))}
        </div>
      )}
    </div>
  )
}
