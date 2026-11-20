import { motion } from 'motion/react'
import { useId, useMemo } from 'react'
import { markRatio, markUri } from '../../../lib/logos'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { range, useSettle, type SceneProps } from '../scene-kit'
import { centred, column, useStage, type Stage } from '../stage'

/* Staggered marks: rows of the mark slide in and settle every other row half a tile over. The tile at the centre is
   the locked mark, the only lime on screen. Wider stages run the rows further out. */

const FIELD = { w: 36, gap: 60, row: 76, rows: 4, cols: 5, clearX: 64, clearY: 40, tint: 0.22 }

/** Tiles each side of the centre, enough to run a row off both edges plus the slide-in and half-tile offset. */
const fieldCols = (s: Stage, gap: number, min: number) => Math.max(min, Math.ceil(s.cx / gap) + 1)

function FieldRow({ c, p, r }: SceneProps & { r: number }) {
  const s = useStage()
  const odd = Math.abs(r) % 2 === 1
  const x = useSettle(p, (odd ? 1 : -1) * FIELD.gap, 0, Math.abs(r) * reel.stagger * 0.5)
  const h = FIELD.w / markRatio(c.id, 'light')
  const dy = r * FIELD.row
  const cols = fieldCols(s, FIELD.gap, FIELD.cols)
  const tiles = range(cols * 2 + 1)
    .map((i) => (i - cols) * FIELD.gap + (odd ? FIELD.gap / 2 : 0))
    .filter((dx) => Math.abs(dx) >= FIELD.clearX || Math.abs(dy) >= FIELD.clearY)
  return (
    <motion.g style={{ x }}>
      {tiles.map((dx) => (
        <image key={dx} href={markUri(c.id, 'dark', { '#E1FE03': c.theme.dark.heroInk })} x={s.cx + dx - FIELD.w / 2} y={s.cy + dy - h / 2} width={FIELD.w} height={h} opacity={FIELD.tint} />
      ))}
    </motion.g>
  )
}

export function VoltFieldScene({ c, p }: SceneProps) {
  const s = useStage()
  return (
    <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" style={{ background: c.theme.dark.heroBg }}>
      {range(FIELD.rows * 2 + 1).map((i) => (
        <FieldRow key={i} c={c} p={p} r={i - FIELD.rows} />
      ))}
    </svg>
  )
}

/* Lime spotlight: one lime disc on black space, and the proof line under it. */

const SPOT = { d: 216, from: 0.6, gap: 40 }

export function VoltSpotlightScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, accent } = c.theme.dark
  const s = useStage()
  const scale = useSettle(p, SPOT.from, 1)
  const y = useSettle(p, 14, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  const lines = c.voice.say[1].split(/(?<=\.) /)
  return (
    <div className="absolute inset-0" style={{ background: heroBg }}>
      <motion.span className="absolute rounded-full" style={{ ...centred(s, SPOT.d), background: accent, scale }} />
      <motion.div className="absolute inset-x-0 text-center leading-[1.15]" style={{ ...displayStyle(c), top: s.cy + SPOT.d / 2 + SPOT.gap, color: heroInk, fontSize: 'calc(26px * var(--x-scale))', y, opacity }}>
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </motion.div>
    </div>
  )
}

/* The 1 inside the O: a giant stencil O frames the mark, then cuts open down a slanted seam. The tagline lands below. */

const O = { w: 248, h: 296, r: 72, innerW: 148, innerH: 196, innerR: 40, part: 12, seam: 14 }
const TAGLINE = { inset: 24, max: 560 }

function roundedRect(s: Stage, w: number, h: number, r: number) {
  const x = s.cx - w / 2
  const y = s.cy - h / 2
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

/** The stencil O round the centre, and the two halves of the stage either side of its slanted seam. */
function stencilO(s: Stage) {
  return {
    ring: `${roundedRect(s, O.w, O.h, O.r)}${roundedRect(s, O.innerW, O.innerH, O.innerR)}`,
    halves: {
      left: `0,0 ${s.cx + O.seam},0 ${s.cx - O.seam},${s.h} 0,${s.h}`,
      right: `${s.cx + O.seam},0 ${s.w},0 ${s.w},${s.h} ${s.cx - O.seam},${s.h}`,
    },
  }
}

export function VoltRevealScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, muted } = c.theme.dark
  const s = useStage()
  const { ring, halves } = useMemo(() => stencilO(s), [s])
  const id = `o-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const left = useSettle(p, 0, -O.part, reel.stagger)
  const right = useSettle(p, 0, O.part, reel.stagger)
  const y = useSettle(p, 14, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  return (
    <div className="absolute inset-0" style={{ background: heroBg, fontFamily: c.type.body.stack }}>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full">
        <defs>
          {Object.entries(halves).map(([side, points]) => (
            <clipPath key={side} id={`${id}-${side}`}>
              <polygon points={points} />
            </clipPath>
          ))}
        </defs>
        <motion.g style={{ x: left }}>
          <path d={ring} fill={heroInk} fillRule="evenodd" clipPath={`url(#${id}-left)`} />
        </motion.g>
        <motion.g style={{ x: right }}>
          <path d={ring} fill={heroInk} fillRule="evenodd" clipPath={`url(#${id}-right)`} />
        </motion.g>
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
