import { motion } from 'motion/react'
import { useId, useMemo } from 'react'
import { markRatio, markUri } from '../../../lib/logos'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { mix, range, useSettle, type SceneProps } from '../scene-kit'
import { column, useStage, type Stage } from '../stage'

/* Rising arcs: arcs rise over a horizon in staggered order, yellow and pink in turn, like a sunrise round the mark.
   A wide stage keeps adding arcs out to its edges. */

const RISE = { base: 384, first: 118, step: 42, count: 5, stroke: 18, travel: 320 }
/** Longest stagger across all the arcs, so a wide sunrise still settles within the scene. */
const RISE_SPREAD = 0.24

/** Radii from the innermost arc out, enough to reach the stage's sides. */
function riseRadii(s: Stage) {
  const count = Math.max(RISE.count, Math.ceil((s.cx - RISE.first) / RISE.step) + 1)
  return Array.from({ length: count }, (_, i) => RISE.first + i * RISE.step)
}

function RisingArc({ p, r, color, delay }: Pick<SceneProps, 'p'> & { r: number; color: string; delay: number }) {
  const { cx } = useStage()
  // Starts far enough down that even the tallest arc is hidden under the horizon.
  const y = useSettle(p, Math.max(RISE.travel, r + RISE.stroke), 0, delay)
  return <motion.path d={`M ${cx - r} ${RISE.base} A ${r} ${r} 0 0 1 ${cx + r} ${RISE.base}`} stroke={color} strokeWidth={RISE.stroke} style={{ y }} />
}

export function ArcRiseScene({ c, p }: SceneProps) {
  const { bg, heroInk, muted, accent: pink, accentText: yellow } = c.theme.dark
  const s = useStage()
  const radii = useMemo(() => riseRadii(s), [s])
  const step = Math.min(reel.stagger * 0.5, RISE_SPREAD / (radii.length - 1))
  const id = `rise-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const y = useSettle(p, 14, 0, reel.stagger * 3)
  const opacity = useSettle(p, 0, 1, reel.stagger * 3)
  return (
    <div className="absolute inset-0" style={{ background: bg, fontFamily: c.type.body.stack }}>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none">
        <defs>
          <clipPath id={id}>
            <rect width={s.w} height={RISE.base} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          {radii.map((r, i) => (
            <RisingArc key={r} p={p} r={r} color={i % 2 ? pink : yellow} delay={i * step} />
          ))}
        </g>
        <line x1={0} x2={s.w} y1={RISE.base + 0.5} y2={RISE.base + 0.5} stroke={mix(heroInk, 22)} />
      </svg>
      <motion.div className="absolute inset-x-0 text-center" style={{ top: RISE.base + 72, y, opacity }}>
        <p className="text-[11px] font-semibold tracking-[0.24em] uppercase" style={{ color: muted }}>{c.name}</p>
        <p className="mt-2 text-[17px] font-medium" style={{ color: heroInk }}>{c.voice.say[0]}</p>
      </motion.div>
    </div>
  )
}

/* Quarter turns: the orbit discs (two marks locked together) tiled on yellow, each turning one quarter step. */

const TURNS = { cell: 90, cols: 4, rows: 7, tile: 62, clearX: 100, clearY: 90, span: 0.5, step: 0.04 }
/** Diagonal sweep length the stagger step is tuned for (the 9:16 grid); longer sweeps on wide grids step faster. */
const TURNS_SWEEP = TURNS.cols + TURNS.rows - 2

function OrbitTile({ c, p, x, y, base, delay }: SceneProps & { x: number; y: number; base: number; delay: number }) {
  const rotate = useSettle(p, base, base + 90, delay, TURNS.span)
  const h = TURNS.tile / markRatio(c.id, 'light')
  const src = markUri(c.id, 'light')
  return (
    <motion.div className="absolute flex flex-col items-center justify-center" style={{ left: x - TURNS.tile / 2, top: y - h, width: TURNS.tile, height: h * 2, rotate }}>
      <img src={src} alt="" style={{ width: TURNS.tile, height: h }} />
      <img src={src} alt="" className="rotate-180" style={{ width: TURNS.tile, height: h }} />
    </motion.div>
  )
}

/** An even number of columns centred on the mark, wide enough to cover the stage. */
function turnTiles(s: Stage) {
  const cols = Math.max(TURNS.cols, 2 * Math.ceil(s.cx / TURNS.cell))
  const step = TURNS.step * Math.min(1, TURNS_SWEEP / (cols + TURNS.rows - 2))
  return range(TURNS.rows).flatMap((r) =>
    range(cols).map((k) => ({
      x: s.cx + (k - (cols - 1) / 2) * TURNS.cell,
      y: s.cy + (r - (TURNS.rows - 1) / 2) * TURNS.cell,
      base: ((k + r) % 4) * 90,
      delay: (k + r) * step,
    })),
  ).filter(({ x, y }) => Math.abs(x - s.cx) >= TURNS.clearX || Math.abs(y - s.cy) >= TURNS.clearY)
}

export function ArcTurnsScene({ c, p }: SceneProps) {
  const s = useStage()
  const tiles = useMemo(() => turnTiles(s), [s])
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: c.theme.light.accent }}>
      {tiles.map((t) => (
        <OrbitTile key={`${t.x}-${t.y}`} c={c} p={p} {...t} />
      ))}
    </div>
  )
}

/* Keeps rising: the closing card. Arc-topped bars climb, the last one in pink, under the tagline. A wide stage runs a
   longer climb across its width. */

const BARS = { base: 600, w: 36, gap: 14, heights: [52, 80, 108, 138, 170, 204], inset: 48, max: 18 }
const TAGLINE = { inset: 24, max: 560 }
/** Longest stagger across all the bars, so a long climb still lands within the scene. */
const BARS_SPREAD = 0.24

/**
 * Bar heights: the six designed steps on the 9:16 stage, and on a wide stage as many bars as fit, climbing between
 * the same first and last heights on the same accelerating curve.
 */
function barHeights(s: Stage) {
  const fit = Math.floor((s.w - BARS.inset * 2 + BARS.gap) / (BARS.w + BARS.gap))
  const count = Math.max(BARS.heights.length, Math.min(BARS.max, fit))
  if (count === BARS.heights.length) return BARS.heights
  const [low, high] = [BARS.heights[0], BARS.heights.at(-1)!]
  return range(count).map((i) => Math.round(low + (high - low) * (i / (count - 1)) ** 1.25))
}

function Bar({ p, left, h, color, delay }: Pick<SceneProps, 'p'> & { left: number; h: number; color: string; delay: number }) {
  const scaleY = useSettle(p, 0, 1, delay)
  return (
    <motion.span
      className="absolute origin-bottom"
      style={{ left, top: BARS.base - h, width: BARS.w, height: h, borderRadius: `${BARS.w / 2}px ${BARS.w / 2}px 0 0`, background: color, scaleY }}
    />
  )
}

export function ArcChartScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, muted, accent: pink, accentText: yellow } = c.theme.dark
  const s = useStage()
  const heights = useMemo(() => barHeights(s), [s])
  const y = useSettle(p, 16, 0, reel.stagger)
  const opacity = useSettle(p, 0, 1, reel.stagger)
  const last = heights.length - 1
  const step = Math.min(reel.stagger * 0.5, BARS_SPREAD / last)
  const left = (s.w - heights.length * (BARS.w + BARS.gap) + BARS.gap) / 2
  return (
    <div className="absolute inset-0" style={{ background: heroBg, fontFamily: c.type.body.stack }}>
      <motion.div className="absolute text-center" style={{ ...column(s, TAGLINE.inset, TAGLINE.max), top: 70, y, opacity }}>
        <p className="text-[11px] font-semibold tracking-[0.24em] uppercase" style={{ color: muted }}>{c.name}</p>
        <p className="mt-3 leading-[1.08]" style={{ ...displayStyle(c), color: heroInk, fontSize: 'calc(32px * var(--x-scale))' }}>{c.tagline}</p>
      </motion.div>
      {heights.map((h, i) => (
        <Bar key={h} p={p} left={left + i * (BARS.w + BARS.gap)} h={h} color={i === last ? pink : yellow} delay={i * step} />
      ))}
      <span className="absolute inset-x-6 h-px" style={{ top: BARS.base, background: mix(heroInk, 22) }} />
    </div>
  )
}
