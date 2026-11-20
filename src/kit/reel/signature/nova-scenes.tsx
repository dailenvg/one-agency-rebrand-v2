import { motion } from 'motion/react'
import { useId } from 'react'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { mix, range, useDrift, useSettle, type SceneProps } from '../scene-kit'
import { centred, column, useStage, type Stage } from '../stage'

const useGradientId = (name: string) => `${name}-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`

/** The brand gradient's first and last stops (mint to violet), for SVG paint servers. */
const gradientStops = (c: SceneProps['c']) => {
  const stops = c.gradient.match(/#[0-9A-F]{6}/gi) ?? [c.theme.dark.accent, c.theme.light.accent]
  return [stops[0], stops.at(-1)!]
}

/* Orbit lines: two ribbons of thin parallel ellipses draw themselves round the locked mark on deep plum, then keep
   turning slowly, like the orbit lines that wrap the portraits on the board's posters. */

const ORBIT = { lines: 3, spacing: 7, stroke: 1.6, turn: 8, maxRx: 440 }
const RIBBONS = [
  { tilt: -18, share: 0.47, ry: 96 },
  { tilt: 22, share: 0.4, ry: 138 },
]

function Ribbon({ p, s, tilt, share, ry, order, paint }: { p: SceneProps['p']; s: Stage; tilt: number; share: number; ry: number; order: number; paint: string }) {
  const rotate = useDrift(p, tilt, tilt + (order ? -ORBIT.turn : ORBIT.turn))
  const rx = Math.min(s.w * share, ORBIT.maxRx)
  return (
    <motion.g style={{ rotate }}>
      {range(ORBIT.lines).map((k) => (
        <RibbonLine key={k} p={p} cx={s.cx} cy={s.cy} rx={rx + k * ORBIT.spacing} ry={ry + k * ORBIT.spacing} delay={(order * ORBIT.lines + k) * reel.stagger * 0.6} paint={paint} />
      ))}
    </motion.g>
  )
}

function RibbonLine({ p, cx, cy, rx, ry, delay, paint }: { p: SceneProps['p']; cx: number; cy: number; rx: number; ry: number; delay: number; paint: string }) {
  const pathLength = useSettle(p, 0, 1, delay)
  return <motion.ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={paint} strokeWidth={ORBIT.stroke} strokeLinecap="round" style={{ pathLength }} />
}

export function NovaOrbitScene({ c, p }: SceneProps) {
  const s = useStage()
  const id = useGradientId('nova-orbit')
  const [from, to] = gradientStops(c)
  return (
    <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none" style={{ background: c.theme.dark.heroBg }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      {RIBBONS.map((r, order) => (
        <Ribbon key={r.tilt} p={p} s={s} {...r} order={order} paint={`url(#${id})`} />
      ))}
    </svg>
  )
}

/* Capsule frames: tall stadium frames rise into a row above the mark on mist, in mint, the gradient and plum, like the
   portrait frames on the board's posters. The first line we say lands below. A wide stage sets more frames. */

const FRAMES = { w: 72, h: 184, gap: 16, top: 72, rise: 48, max: 9, inset: 24 }
const LINE = { inset: 28, max: 560, gap: 64 }

/** An odd number of frames that fits the stage, so the row stays centred on the mark. */
const frameCount = (s: Stage) => {
  const fit = Math.floor((s.w - FRAMES.inset * 2 + FRAMES.gap) / (FRAMES.w + FRAMES.gap))
  const odd = fit % 2 ? fit : fit - 1
  return Math.max(3, Math.min(FRAMES.max, odd))
}

function Frame({ p, left, fill, order }: { p: SceneProps['p']; left: number; fill: string; order: number }) {
  const y = useSettle(p, FRAMES.rise, 0, order * reel.stagger)
  const opacity = useSettle(p, 0, 1, order * reel.stagger)
  return <motion.span className="absolute rounded-full" style={{ left, top: FRAMES.top, width: FRAMES.w, height: FRAMES.h, background: fill, y, opacity }} />
}

export function NovaFramesScene({ c, p }: SceneProps) {
  const { surface, ink } = c.theme.light
  const s = useStage()
  const count = frameCount(s)
  const fills = [c.theme.dark.accent, c.gradient, c.theme.dark.heroBg]
  const left = s.cx - (count * FRAMES.w + (count - 1) * FRAMES.gap) / 2
  const mid = (count - 1) / 2
  const y = useSettle(p, 14, 0, reel.stagger * 3)
  const opacity = useSettle(p, 0, 1, reel.stagger * 3)
  return (
    <div className="absolute inset-0" style={{ background: surface }}>
      {range(count).map((i) => (
        <Frame key={i} p={p} left={left + i * (FRAMES.w + FRAMES.gap)} fill={fills[Math.abs(i - mid) % fills.length]} order={Math.abs(i - mid)} />
      ))}
      <motion.p
        className="absolute text-center leading-[1.1]"
        style={{ ...displayStyle(c), ...column(s, LINE.inset, LINE.max), top: s.cy + LINE.gap, color: ink, fontSize: 'calc(24px * var(--x-scale))', y, opacity }}
      >
        {c.voice.say[0]}
      </motion.p>
    </div>
  )
}

/* The open corner: the closing card on deep plum. The O's outline draws round the mark, its one square corner traced
   in mint, and the tagline lands below. */

const O = { w: 252, h: 176, r: 80, stroke: 2, corner: 44, cornerStroke: 5 }
const TAGLINE = { inset: 24, max: 560 }

/** The O's outline round the stage centre: three rounded corners and the square one at the top right. */
function openCorner(s: Stage) {
  const { left: x, top: y, width: w, height: h } = centred(s, O.w, O.h)
  const r = O.r
  return {
    outline: `M${x + r} ${y}H${x + w}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`,
    corner: `M${x + w - O.corner} ${y}H${x + w}V${y + O.corner}`,
  }
}

export function NovaCornerScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, muted, accent } = c.theme.dark
  const s = useStage()
  const { outline, corner } = openCorner(s)
  const draw = useSettle(p, 0, 1)
  const mark = useSettle(p, 0, 1, reel.stagger * 2, reel.settle * 0.5)
  const y = useSettle(p, 14, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  return (
    <div className="absolute inset-0" style={{ background: heroBg, fontFamily: c.type.body.stack }}>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none">
        <motion.path d={outline} stroke={mix(heroInk, 45)} strokeWidth={O.stroke} style={{ pathLength: draw }} />
        <motion.path d={corner} stroke={accent} strokeWidth={O.cornerStroke} strokeLinecap="square" style={{ pathLength: mark }} />
      </svg>
      <p className="absolute inset-x-0 text-center text-[11px] font-semibold tracking-[0.24em] uppercase" style={{ top: s.cy - O.h / 2 - 44, color: muted }}>
        {c.name}
      </p>
      <motion.p
        className="absolute text-center leading-[1.1]"
        style={{ ...displayStyle(c), ...column(s, TAGLINE.inset, TAGLINE.max), top: s.cy + O.h / 2 + 36, color: heroInk, fontSize: 'calc(30px * var(--x-scale))', y, opacity }}
      >
        {c.tagline}
      </motion.p>
    </div>
  )
}
