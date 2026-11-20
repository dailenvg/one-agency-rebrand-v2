import { useId, useMemo, type ReactNode } from 'react'
import type { Concept, ConceptId, Mode, ThemeTokens } from '../data/concepts'
import { markRatio, markUri } from '../lib/logos'

const W = 400
const H = 300
/** Depth of the pressed edge in tile units, about a pixel at tile size. */
const DEPTH = 1.2

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

interface MarkArt {
  href: string
  ratio: number
}

/** The mark at a given width, centred on the origin and optionally turned. Only its silhouette is used. */
function Mark({ art, width, turn = 0 }: { art: MarkArt; width: number; turn?: number }) {
  const h = width / art.ratio
  return <image href={art.href} x={-width / 2} y={-h / 2} width={width} height={h} transform={turn ? `rotate(${turn})` : undefined} />
}

/** Cells in rows offset by half a cell, the repeat rule every board shares, centred so the bleed is even. */
function HalfDrop({ gap, row, cell }: { gap: number; row: number; cell: (r: number, k: number) => ReactNode }) {
  const rows = Math.ceil(H / row) + 1
  const cols = Math.ceil(W / gap) + 2
  const ox = (W - (cols - 1) * gap) / 2 - gap / 4
  const oy = (H - (rows - 1) * row) / 2
  return range(rows).map((r) =>
    range(cols).map((k) => (
      <g key={`${r}-${k}`} transform={`translate(${ox + k * gap + ((r % 2) * gap) / 2} ${oy + r * row})`}>
        {cell(r, k)}
      </g>
    )),
  )
}

type Draw = (art: MarkArt) => ReactNode

const draws: Record<ConceptId, Draw> = {
  nova: (art) => <HalfDrop gap={84} row={56} cell={() => <Mark art={art} width={52} />} />,
  volt: (art) => <HalfDrop gap={52} row={58} cell={() => <Mark art={art} width={26} />} />,
  pill: (art) => <HalfDrop gap={100} row={44} cell={() => <Mark art={art} width={76} />} />,
  // Quarter turns only, stepping along the diagonal as the orbit pattern does.
  arc: (art) => <HalfDrop gap={74} row={64} cell={(r, k) => <Mark art={art} width={54} turn={((r + k) % 4) * 90} />} />,
}

/** Edge tones for the pressed-in look, lit from the top left: a shaded upper rim and a lit lower rim. */
function bevel(t: ThemeTokens, mode: Mode) {
  return mode === 'light'
    ? { shade: t.ink, shadeOpacity: 0.14, light: t.bg, lightOpacity: 1 }
    : { shade: t.bg, shadeOpacity: 1, light: t.ink, lightOpacity: 0.1 }
}

/**
 * Blind deboss: the concept's mark pressed into the surface one tone deeper, tiled by the board's own repeat logic,
 * like branded stationery. Built from theme tokens so it follows light and dark mode. Static on purpose.
 */
export function Deboss({ c, mode, className = '' }: { c: Concept; mode: Mode; className?: string }) {
  const id = `db-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const t = c.theme[mode]
  const edge = bevel(t, mode)
  const concept = c.id
  const body = useMemo(() => draws[concept]({ href: markUri(concept, 'light'), ratio: markRatio(concept, 'light') }), [concept])
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className}>
      <filter id={id} colorInterpolationFilters="sRGB">
        <feFlood floodColor={t.surface2} />
        <feComposite in2="SourceAlpha" operator="in" result="face" />
        <feOffset in="SourceAlpha" dx={DEPTH} dy={DEPTH} result="down" />
        <feComposite in="SourceAlpha" in2="down" operator="out" result="upper" />
        <feFlood floodColor={edge.shade} floodOpacity={edge.shadeOpacity} />
        <feComposite in2="upper" operator="in" result="shade" />
        <feOffset in="SourceAlpha" dx={-DEPTH} dy={-DEPTH} result="up" />
        <feComposite in="SourceAlpha" in2="up" operator="out" result="lower" />
        <feFlood floodColor={edge.light} floodOpacity={edge.lightOpacity} />
        <feComposite in2="lower" operator="in" result="light" />
        <feMerge>
          <feMergeNode in="face" />
          <feMergeNode in="shade" />
          <feMergeNode in="light" />
        </feMerge>
      </filter>
      <rect width={W} height={H} fill={t.surface} />
      <g filter={`url(#${id})`}>{body}</g>
    </svg>
  )
}
