import { motion, useInView, useReducedMotion, type Transition } from 'motion/react'
import { useId, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Concept, PatternKind } from '../data/concepts'
import { markUri } from '../lib/logos'
import { ease } from '../lib/motion'

const W = 800
const H = 500

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hex = (c: Concept, name: string) => c.palette.find((s) => s.name === name)?.hex ?? '#000'

/** Mark proportions (width / height) of the generated logo files. */
const ratio = { volt: 101.6 / 119.3, arc: 172.7 / 83.9 }

const loop = (duration: number, extra: Transition = {}): Transition => ({ duration, repeat: Infinity, ease: ease.inOut, ...extra })
const drift = (duration: number): Transition => ({ duration, repeat: Infinity, ease: 'linear' })
/** Scale SVG shapes around their own centre (or a given point) instead of the canvas origin. */
const own = (origin = 'center'): CSSProperties => ({ transformBox: 'fill-box', transformOrigin: origin })
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

interface RowsProps {
  href: string
  w: number
  h: number
  gap: number
  row: number
  play: boolean
  period: number
  /** Odd rows drift the other way, like a ticker. Otherwise the whole field flows one way. */
  alternate?: boolean
}

/** A mark tiled in rows offset by half a tile. Playing, each row slides one tile per loop, so it repeats seamlessly. */
function StaggeredRows({ href, w, h, gap, row, play, period, alternate = false }: RowsProps) {
  const cols = Math.ceil(W / gap) + 2
  return range(Math.ceil(H / row) + 1).map((r) => {
    const dir = alternate && r % 2 ? -1 : 1
    return (
      <motion.g key={r} initial={false} animate={{ x: play ? [0, dir * gap] : 0 }} transition={drift(period)}>
        {range(cols).map((k) => (
          <image key={k} href={href} x={(k - 1) * gap + ((r % 2) * gap) / 2 + (gap - w) / 2} y={r * row + (row - h) / 2} width={w} height={h} />
        ))}
      </motion.g>
    )
  })
}

type Draw = (c: Concept, play: boolean, id: string) => ReactNode

/** Capsule frames for the frames pattern: three tall stadiums, the middle one raised, like the board's portrait frames. */
const FRAMES = { w: 150, h: 330, gap: 34, lift: 36 }
/** Orbit lines: three parallel ellipses per ribbon, a light running along each once per `period` seconds. */
const ORBIT = { rx: 372, ry: 104, spacing: 9, lines: 3, comet: 0.22, period: 7 }

/** An ellipse's perimeter (Ramanujan), so a dash can run once round it and loop seamlessly. */
const perimeter = (a: number, b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))

const draws: Record<PatternKind, Draw> = {
  frames: (c, play, id) => {
    const { heroBg } = c.theme.dark
    const [from, to] = c.gradient.match(/#[0-9A-F]{6}/gi) ?? []
    const fills = [c.theme.dark.accent, `url(#${id}-g)`, c.theme.light.surface2]
    const left = (W - FRAMES.w * 3 - FRAMES.gap * 2) / 2
    const ribbons = [-14, 10]
    return (
      <>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
          <linearGradient id={`${id}-orbit`} x1="0" x2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={heroBg} />
        {fills.map((fill, i) => {
          const y = (H - FRAMES.h) / 2 + (i === 1 ? -FRAMES.lift / 2 : FRAMES.lift / 2)
          return (
            <motion.rect
              key={fill}
              x={left + i * (FRAMES.w + FRAMES.gap)}
              y={y}
              width={FRAMES.w}
              height={FRAMES.h}
              rx={FRAMES.w / 2}
              fill={fill}
              initial={false}
              animate={{ y: play ? [0, -12, 0] : 0 }}
              transition={loop(4, { delay: i * 0.4 })}
            />
          )
        })}
        {ribbons.map((tilt, r) => (
          <g key={tilt} transform={`rotate(${tilt} ${W / 2} ${H / 2})`} fill="none" stroke={`url(#${id}-orbit)`} strokeWidth={2}>
            {range(ORBIT.lines).map((k) => {
              const shape = { cx: W / 2, cy: H / 2, rx: ORBIT.rx + k * ORBIT.spacing - r * 40, ry: ORBIT.ry + k * ORBIT.spacing + r * 30 }
              const around = perimeter(shape.rx, shape.ry)
              const comet = around * ORBIT.comet
              return (
                <g key={k}>
                  <ellipse {...shape} strokeOpacity={0.35} />
                  <motion.ellipse
                    {...shape}
                    strokeDasharray={`${comet} ${around - comet}`}
                    initial={false}
                    animate={{ strokeDashoffset: play ? [0, (r ? 1 : -1) * around] : 0 }}
                    transition={drift(ORBIT.period + r * 2)}
                  />
                </g>
              )
            })}
          </g>
        ))}
      </>
    )
  },

  marks: (c, play) => {
    const w = 50
    return (
      <>
        <rect width={W} height={H} fill={hex(c, 'Black')} />
        <StaggeredRows href={markUri(c.id, 'light', { '#000000': hex(c, 'Volt Lime') })} w={w} h={w / ratio.volt} gap={71} row={81} play={play} period={6} alternate />
      </>
    )
  },

  orbits: (c, play) => {
    // Two marks locked into a disc. The disc looks the same turned half way, so a 180° turn loops seamlessly.
    const w = 116
    const h = w / ratio.arc
    const gap = 130
    const href = markUri(c.id, 'light')
    return (
      <>
        <rect width={W} height={H} fill={hex(c, 'Arc Yellow')} />
        {range(Math.ceil(H / gap) + 1).map((r) =>
          range(Math.ceil(W / gap) + 2).map((k) => (
            <g key={`${r}-${k}`} transform={`translate(${(k - 0.5) * gap + ((r % 2) * gap) / 2} ${r * gap + gap / 4}) rotate(${((k + r) % 4) * 90})`}>
              <motion.g
                style={own()}
                initial={false}
                animate={{ rotate: play ? [0, 180] : 0 }}
                transition={loop(1.2, { delay: (r + k) * 0.08, repeatDelay: 2.4 })}
              >
                <image href={href} x={-w / 2} y={-h} width={w} height={h} />
                <image href={href} x={-w / 2} y={-h} width={w} height={h} transform="rotate(180)" />
              </motion.g>
            </g>
          )),
        )}
      </>
    )
  },

  capsules: (c, play, id) => {
    const r = rng(6203)
    return (
      <>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" x2="1">
            <stop offset="0" stopColor={hex(c, 'Pulse Green')} />
            <stop offset="1" stopColor={hex(c, 'Ultra Violet')} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill={hex(c, 'Plum Night')} />
        {range(9).map((i) => {
          const h = 38
          const y = 26 + i * 52
          const full = W - 120
          const w = full * (1 - i * 0.085) * (0.85 + r() * 0.15)
          return (
            <g key={i}>
              <rect x={60} y={y} width={full} height={h} rx={h / 2} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
              <motion.rect
                x={60}
                y={y}
                height={h}
                rx={h / 2}
                fill={`url(#${id}-g)`}
                opacity={1 - i * 0.06}
                initial={false}
                animate={{ width: play ? [h, w] : w }}
                transition={loop(1.6, { delay: i * 0.12, repeatType: 'mirror', repeatDelay: 1.6 })}
              />
            </g>
          )
        })}
      </>
    )
  },
}

/**
 * Procedural graphic language for each concept, tiled from the board's own mark geometry. Deterministic, so it
 * never reshuffles between renders. With `animated`, each pattern acts out its idea on a loop while it is on screen.
 */
export function Pattern({ c, className = '', animated = false }: { c: Concept; className?: string; animated?: boolean }) {
  const id = `pg-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: '-5%' })
  const reduce = useReducedMotion()
  const play = animated && inView && !reduce
  const body = useMemo(() => draws[c.graphic.pattern](c, play, id), [c, id, play])

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label={`${c.graphic.name} pattern`}>
      {body}
    </svg>
  )
}
