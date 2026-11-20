import { motion, useTransform, type MotionValue } from 'motion/react'
import { useId, useMemo } from 'react'
import { company } from '../../../data/concepts'
import { iconUri } from '../../../lib/logos'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { mix, range, softShadow, swatch, useSettle, type SceneProps } from '../scene-kit'
import { column, useStage, type Stage } from '../stage'

/** The Spark board's four-point spark, normalised to a 100 unit box centred on the origin. */
const SPARK =
  'M-10.4 -50L10.4 -50C10.2 -36.7 10.3 -22.6 10.4 -9.3C20.7 -9.9 31.7 -9.1 42.1 -9.4C44.7 -9.5 47.3 -9.4 49.9 -9.4C50.1 -3.3 50 3.2 50 9.4C39.9 9.5 30.3 13.3 22.9 20.2C16.9 25.7 12.7 33.3 11 41.3C10.4 44 10.4 47 10.3 49.7L10.1 49.9C8 50.1 4.8 50 2.6 50L-10.4 49.9L-10.4 9.5L-50 9.5C-50 3.3 -50 -3.2 -50 -9.3C-43.2 -9.9 -37.9 -10.5 -31.8 -13.8C-17.3 -21.8 -11.3 -34 -10.4 -50Z'

const useGradientId = (name: string) => `${name}-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`

/** The spark's green-to-lime gradient, as an SVG paint server. */
function SparkGradient({ c, id }: { c: SceneProps['c']; id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stopColor={swatch(c, 'Spark Green')} />
      <stop offset="1" stopColor={swatch(c, 'Spark Lime')} />
    </linearGradient>
  )
}

/* Spark grid: a tight grid of quiet sparks on navy. One of them catches, and a line carries that moment to the mark. */

const GRID = { size: 24, gap: 46, cols: 4, rows: 7, clearX: 70, clearY: 60 }
/** The spark that catches, in grid steps from the centre. */
const MOMENT = { k: 2, r: -3, light: 0.22, pop: 1.9, rest: 1.5, ring: 44 }

/** Offsets from the centre of every quiet spark, enough columns to cover the stage. */
function quietSparks(s: Stage) {
  const cols = Math.max(GRID.cols, Math.ceil(s.cx / GRID.gap))
  return range(GRID.rows * 2 + 1)
    .flatMap((r) => range(cols * 2 + 1).map((k) => ({ dx: (k - cols) * GRID.gap, dy: (r - GRID.rows) * GRID.gap })))
    .filter(({ dx, dy }) => Math.abs(dx) >= GRID.clearX || Math.abs(dy) >= GRID.clearY)
    .filter(({ dx, dy }) => dx !== MOMENT.k * GRID.gap || dy !== MOMENT.r * GRID.gap)
}

const sparkAt = (x: number, y: number, size: number) => `translate(${x} ${y}) scale(${size / 100})`

export function SparkGridScene({ c, p }: SceneProps) {
  const { heroBg, heroInk } = c.theme.dark
  const s = useStage()
  const quiet = useMemo(() => quietSparks(s), [s])
  const moment = { x: s.cx + MOMENT.k * GRID.gap, y: s.cy + MOMENT.r * GRID.gap }
  const id = useGradientId('spark-grid')
  const scale = useTransform(p, [MOMENT.light, MOMENT.light + 0.08, MOMENT.light + 0.2], [1, MOMENT.pop, MOMENT.rest])
  const lit = useSettle(p, 0, 1, MOMENT.light, reel.stagger)
  const ring = useSettle(p, 0, 1, MOMENT.light, 0.4)
  const ringFade = useSettle(p, 0.8, 0, MOMENT.light, 0.4)
  const pathLength = useSettle(p, 0, 1, MOMENT.light + 0.12, 0.4)
  return (
    <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" style={{ background: heroBg }}>
      <defs>
        <SparkGradient c={c} id={id} />
      </defs>
      {quiet.map(({ dx, dy }) => (
        <path key={`${dx}-${dy}`} d={SPARK} transform={sparkAt(s.cx + dx, s.cy + dy, GRID.size)} style={{ fill: mix(heroInk, 14, heroBg) }} />
      ))}
      <motion.circle cx={moment.x} cy={moment.y} r={MOMENT.ring} fill="none" stroke={`url(#${id})`} strokeWidth={2} style={{ scale: ring, opacity: ringFade }} />
      <motion.path
        d={`M ${moment.x} ${moment.y + GRID.size} Q ${moment.x} ${s.cy - 10} ${s.cx + 64} ${s.cy - 10}`}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ pathLength }}
      />
      <g transform={`translate(${moment.x} ${moment.y})`}>
        <motion.g style={{ scale }}>
          <path d={SPARK} transform={`scale(${GRID.size / 100})`} style={{ fill: mix(heroInk, 14, heroBg) }} />
          <motion.path d={SPARK} transform={`scale(${GRID.size / 100})`} fill={`url(#${id})`} style={{ opacity: lit }} />
        </motion.g>
      </g>
    </svg>
  )
}

/* Spark burst: on the green-to-lime gradient, navy sparks spin out from the mark a quarter turn as they go. A wide
   stage adds outer rings that carry the burst out to its sides. */

const BURST = {
  rings: [
    { count: 8, r: 128, size: 30, offset: 0 },
    { count: 8, r: 214, size: 20, offset: 22.5 },
    { count: 16, r: 330, size: 16, offset: 11.25 },
    { count: 16, r: 460, size: 13, offset: 0 },
    { count: 24, r: 600, size: 11, offset: 7.5 },
  ],
  delay: 0.06,
  /** A ring shows once the stage reaches this far past it on each side, so the 9:16 burst keeps its two rings. */
  reach: 40,
  /** Rings every stage shows. */
  core: 2,
}

function BurstSpark({ p, angle, r, size, delay, fill }: { p: MotionValue<number>; angle: number; r: number; size: number; delay: number; fill: string }) {
  const { cx, cy } = useStage()
  const distance = useSettle(p, 0, r, delay)
  const x = useTransform(distance, (d) => Math.cos((angle * Math.PI) / 180) * d)
  const y = useTransform(distance, (d) => Math.sin((angle * Math.PI) / 180) * d)
  const rotate = useSettle(p, -90, 0, delay)
  const scale = useSettle(p, 0.3, 1, delay)
  return (
    <motion.svg viewBox="-50 -50 100 100" className="absolute" style={{ left: cx - size / 2, top: cy - size / 2, width: size, height: size, x, y, rotate, scale }}>
      <path d={SPARK} fill={fill} />
    </motion.svg>
  )
}

export function SparkBurstScene({ c, p }: SceneProps) {
  const navy = swatch(c, 'Midnight')
  const s = useStage()
  const rings = BURST.rings.filter((ring, j) => j < BURST.core || ring.r < s.cx + BURST.reach)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: c.gradient }}>
      {rings.flatMap((ring, j) =>
        range(ring.count).map((i) => (
          <BurstSpark key={`${j}-${i}`} p={p} angle={ring.offset + (i * 360) / ring.count} r={ring.r} size={ring.size} delay={j * BURST.delay} fill={navy} />
        )),
      )}
    </div>
  )
}

/* The moment: the closing card. A notification lands, a gradient ring draws round the mark, and the tagline settles. */

const NOTE = { top: 72, drop: 48, ring: 100, stroke: 4, icon: 40, inset: 20, max: 400 }
const TAGLINE = { inset: 32, max: 520 }

export function SparkMomentScene({ c, p }: SceneProps) {
  const { bg, surface2, ink, muted, heroInk } = c.theme.dark
  const id = useGradientId('spark-ring')
  const drop = useSettle(p, -NOTE.drop, 0)
  const noteOpacity = useSettle(p, 0, 1)
  const pathLength = useSettle(p, 0, 1, reel.stagger)
  const y = useSettle(p, 14, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  const social = c.voice.samples.find((sample) => sample.label === 'Social')?.text
  const s = useStage()
  const { cx, cy } = s
  return (
    <div className="absolute inset-0" style={{ background: bg, fontFamily: c.type.body.stack }}>
      <motion.div
        className="absolute flex items-center gap-3 rounded-[20px] p-3"
        style={{ ...column(s, NOTE.inset, NOTE.max), top: NOTE.top, background: surface2, boxShadow: softShadow, y: drop, opacity: noteOpacity }}
      >
        <img src={iconUri(c.id, c.favicon, { size: 80 })} alt="" className="shrink-0" style={{ width: NOTE.icon, height: NOTE.icon }} />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold" style={{ color: ink }}>{company.name}</p>
          <p className="text-[11px] leading-snug" style={{ color: muted }}>{social}</p>
        </div>
      </motion.div>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none">
        <defs>
          <SparkGradient c={c} id={id} />
        </defs>
        <motion.circle
          cx={cx}
          cy={cy}
          r={NOTE.ring}
          stroke={`url(#${id})`}
          strokeWidth={NOTE.stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ pathLength }}
        />
      </svg>
      <motion.p
        className="absolute text-center text-[26px] leading-[1.1]"
        style={{ ...displayStyle(c), ...column(s, TAGLINE.inset, TAGLINE.max), top: cy + NOTE.ring + 40, color: heroInk, y, opacity }}
      >
        {c.tagline}
      </motion.p>
    </div>
  )
}
