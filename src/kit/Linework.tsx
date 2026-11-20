import { useId, useMemo, type ReactNode } from 'react'
import type { Concept, ConceptId } from '../data/concepts'

const W = 400
const H = 300
const LINE_OPACITY = 0.28
const ACCENT_WIDTH = 1.5

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

/** Hairline stroke props for the tone-on-tone field. */
const hair = (color: string) => ({ fill: 'none', stroke: color, strokeOpacity: LINE_OPACITY, strokeWidth: 1 })
/** The one accent moment each texture allows itself. */
const spot = (color: string) => ({ stroke: color, strokeOpacity: 1, strokeWidth: ACCENT_WIDTH })

interface Pen {
  line: string
  accent: string
  id: string
}

type Draw = (p: Pen) => ReactNode

/** Volt: the angle of the two cuts that free the 1 from the O, measured off the mark's notch. */
const VOLT_CUT = 49.5

/** Nova: the O's outline, rounded on three corners and square at the top right, at a given box and corner radius. */
function openCorner(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

const draws: Record<ConceptId, Draw> = {
  // The O's outline offset outwards step by step, its one square corner kept at every size.
  nova: ({ line, accent }) => {
    const step = 12
    return (
      <g {...hair(line)}>
        {range(18).map((k) => {
          const w = 92 + 2 * k * step
          const h = 60 + 2 * k * step
          return <path key={k} d={openCorner((W - w) / 2, (H - h) / 2, w, h, 26 + k * step)} {...(k === 4 ? spot(accent) : {})} />
        })}
      </g>
    )
  },

  // Paired cuts at the notch angle, the 1's slot between each pair, broken by stencil ties like cut sheet metal.
  volt: ({ line, accent, id }) => {
    const period = 26
    const slot = 8
    const reach = Math.hypot(W, H)
    const n = Math.ceil(reach / period)
    const tie = 6
    const tieGap = 64
    return (
      <>
        <mask id={`${id}-ties`}>
          <rect width={W} height={H} fill="white" />
          {range(Math.ceil(H / tieGap)).map((r) => (
            <rect key={r} y={tieGap / 2 + r * tieGap} width={W} height={tie} fill="black" />
          ))}
        </mask>
        <g mask={`url(#${id}-ties)`}>
          <g {...hair(line)} transform={`rotate(${90 - VOLT_CUT} ${W / 2} ${H / 2})`}>
            {range(n * 2 + 1).map((i) => {
              const x = W / 2 + (i - n) * period
              const accentPair = i === n + 1
              return (
                <g key={i} {...(accentPair ? spot(accent) : {})}>
                  <line x1={x} x2={x} y1={H / 2 - reach} y2={H / 2 + reach} />
                  <line x1={x + slot} x2={x + slot} y1={H / 2 - reach} y2={H / 2 + reach} />
                </g>
              )
            })}
          </g>
        </g>
      </>
    )
  },

  // Concentric capsule contours, the mark's ring offset outwards like a running track.
  pill: ({ line, accent }) => {
    const step = 11
    return (
      <g {...hair(line)}>
        {range(21).map((k) => {
          const w = 106 + 2 * k * step
          const h = 20 + 2 * k * step
          return <rect key={k} x={(W - w) / 2} y={(H - h) / 2} width={w} height={h} rx={h / 2} {...(k === 5 ? spot(accent) : {})} />
        })}
      </g>
    )
  },

  // Concentric quarter arcs from one corner of each cell, every cell turned in quarter steps only.
  arc: ({ line, accent }) => {
    const cell = 50
    const radii = range(5).map((i) => (i + 1) * (cell / 5))
    // A fixed scramble of quarter turns, so the field reads as composed rather than as a repeat.
    const turn = (r: number, k: number) => ((r * 5 + k * 3 + ((r * k) % 3)) % 4) * 90
    return (
      <g {...hair(line)}>
        {range(H / cell).map((r) =>
          range(W / cell).map((k) => (
            <g
              key={`${r}-${k}`}
              transform={`translate(${(k + 0.5) * cell} ${(r + 0.5) * cell}) rotate(${turn(r, k)}) translate(${-cell / 2} ${-cell / 2})`}
              {...(r === 2 && k === 5 ? spot(accent) : {})}
            >
              {radii.map((R) => (
                <path key={R} d={`M${R} 0A${R} ${R} 0 0 1 0 ${R}`} />
              ))}
            </g>
          )),
        )}
      </g>
    )
  },
}

/**
 * Monoline texture drawn from each concept's own mark geometry: hairlines laid tone on tone over the hero colour, with
 * a single accent line. Static on purpose, the calm counterpart to the live pattern.
 */
export function Linework({ c, className = '' }: { c: Concept; className?: string }) {
  const id = `lw-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const { heroBg, heroInk, accentText } = c.theme.dark
  const draw = draws[c.id]
  const body = useMemo(() => draw({ line: heroInk, accent: accentText, id }), [draw, heroInk, accentText, id])
  return (
    // Non-scaling strokes: the tile spans about 230px (tablet, three-up) to 410px, and scaled 1-unit hairlines would thin
    // to half a pixel and wash out. vector-effect does not inherit, so it is set on every element.
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={`[&_*]:[vector-effect:non-scaling-stroke] ${className}`}>
      <rect width={W} height={H} fill={heroBg} />
      {body}
    </svg>
  )
}
