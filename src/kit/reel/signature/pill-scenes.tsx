import { motion, useTransform, type MotionValue } from 'motion/react'
import { useMemo, type CSSProperties } from 'react'
import { company } from '../../../data/concepts'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { mix, range, useSettle, type SceneProps } from '../scene-kit'
import { column, isWide, useStage, type Stage } from '../stage'

/** Clips a full-width gradient to its first `v` share, so the colour stays anchored: green is always intent. */
const fillTo = (v: number) => `inset(0 ${((1 - v) * 100).toFixed(2)}% 0 0 round 999px)`

/** A capsule filled with the brand gradient up to `fill`, a 0 to 1 motion value. */
function Capsule({ c, fill, track, style }: { c: SceneProps['c']; fill: MotionValue<number>; track: string; style: CSSProperties }) {
  const clipPath = useTransform(fill, fillTo)
  return (
    <div className="absolute overflow-hidden rounded-full" style={{ ...style, background: track }}>
      <motion.span className="absolute inset-0" style={{ background: c.gradient, clipPath }} />
    </div>
  )
}

/* Progress capsules: rows of capsules fill like a funnel report, longest nearest the mark, on plum night. A wide
   stage sets the report in columns, the centre column filling furthest. */

const CAPS = { h: 30, x: 24, clear: 70, step: 48, rows: 6, start: 0.06, falloff: 0.14, gap: 20, maxLen: 420, columnFalloff: 0.12 }

/** Every capsule: its row (distance from the mark), box, and how much of its fill it reaches. */
function capsuleGrid(s: Stage) {
  const span = s.w - CAPS.x * 2
  const cols = Math.max(1, Math.round(span / CAPS.maxLen))
  const len = (span - CAPS.gap * (cols - 1)) / cols
  return range(CAPS.rows).flatMap((j) =>
    [-1, 1].flatMap((side) =>
      range(cols).map((col) => ({
        j,
        top: s.cy + side * (CAPS.clear + j * CAPS.step) - CAPS.h / 2,
        left: CAPS.x + col * (len + CAPS.gap),
        width: len,
        share: 1 - Math.abs(col - (cols - 1) / 2) * CAPS.columnFalloff,
      })),
    ),
  )
}

function CapsuleRow({ c, p, j, top, left, width, share }: SceneProps & ReturnType<typeof capsuleGrid>[number]) {
  const fill = useSettle(p, CAPS.start, (1 - j * CAPS.falloff) * share, j * reel.stagger * 0.5)
  return <Capsule c={c} fill={fill} track={mix(c.theme.dark.heroInk, 10)} style={{ left, width, top, height: CAPS.h }} />
}

export function PillCapsulesScene({ c, p }: SceneProps) {
  const s = useStage()
  const capsules = useMemo(() => capsuleGrid(s), [s])
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: c.theme.dark.heroBg }}>
      {capsules.map((capsule) => (
        <CapsuleRow key={`${capsule.top}-${capsule.left}`} c={c} p={p} {...capsule} />
      ))}
    </div>
  )
}

/* Full funnel: one capsule progress bar fills across the six steps, lighting each one as it passes. */

const FUNNEL = { top: 404, h: 36, x: 24, max: 960, labels: 452, start: 0.1, head: 0.08 }
const HEADLINE = { inset: 32, max: 620 }

function StepLabel({ fill, step, i, color }: { fill: MotionValue<number>; step: string; i: number; color: string }) {
  const n = company.steps.length
  const opacity = useTransform(fill, [(i + 0.2) / n, (i + 0.8) / n], [0.35, 1])
  return (
    <motion.span className="text-center text-[10px] font-bold" style={{ color, opacity }}>
      {step}
    </motion.span>
  )
}

export function PillFunnelScene({ c, p }: SceneProps) {
  const { surface, surface2, ink, muted } = c.theme.light
  const s = useStage()
  const fill = useSettle(p, FUNNEL.head, 1, FUNNEL.start)
  const [lead, ...rest] = c.voice.say[0].split(/(?<=\.) /)
  const bar = column(s, FUNNEL.x, FUNNEL.max)
  return (
    <div className="absolute inset-0" style={{ background: surface, fontFamily: c.type.body.stack }}>
      <div className="absolute text-center" style={{ ...column(s, HEADLINE.inset, HEADLINE.max), top: 92 }}>
        <p className="text-[27px] leading-[1.05]" style={{ ...displayStyle(c), color: ink }}>{lead}</p>
        <p className="mt-3 text-[13px] font-medium" style={{ color: muted }}>{rest.join(' ')}</p>
      </div>
      <Capsule c={c} fill={fill} track={surface2} style={{ ...bar, top: FUNNEL.top, height: FUNNEL.h }} />
      <div className="absolute grid grid-cols-6" style={{ ...bar, top: FUNNEL.labels }}>
        {company.steps.map((step, i) => (
          <StepLabel key={step} fill={fill} step={step} i={i} color={ink} />
        ))}
      </div>
    </div>
  )
}

/* Intent to revenue: the closing card on plum night. The tagline above, and a capsule toggle that fills as it
   switches on. */

const TOGGLE = { w: 168, h: 72, top: 420, knob: 56, pad: 8 }
const TAGLINE = { inset: 32, max: 620 }
/** On a wide stage, rails run from the toggle out to both edges and fill as it switches on. */
const RAIL = { h: 6, gap: 20, inset: 24 }

export function PillToggleScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, muted } = c.theme.dark
  const s = useStage()
  const { cx } = s
  const on = useSettle(p, 0, 1, reel.stagger)
  const x = useTransform(on, [0, 1], [0, TOGGLE.w - TOGGLE.knob - TOGGLE.pad * 2])
  const fill = useTransform(on, [0, 1], [(TOGGLE.knob + TOGGLE.pad * 2) / TOGGLE.w, 1])
  const y = useSettle(p, 16, 0)
  const opacity = useSettle(p, 0, 1)
  return (
    <div className="absolute inset-0" style={{ background: heroBg, fontFamily: c.type.body.stack }}>
      <motion.p className="absolute text-center text-[30px] leading-[1.05]" style={{ ...displayStyle(c), ...column(s, TAGLINE.inset, TAGLINE.max), top: 104, color: heroInk, y, opacity }}>
        {c.tagline}
      </motion.p>
      {isWide(s) && <ToggleRails c={c} on={on} />}
      <Capsule c={c} fill={fill} track={mix(heroInk, 12)} style={{ left: cx - TOGGLE.w / 2, top: TOGGLE.top, width: TOGGLE.w, height: TOGGLE.h }} />
      <motion.span
        className="absolute rounded-full bg-white shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]"
        style={{ left: cx - TOGGLE.w / 2 + TOGGLE.pad, top: TOGGLE.top + TOGGLE.pad, width: TOGGLE.knob, height: TOGGLE.knob, x }}
      />
      <p className="absolute inset-x-0 text-center text-[18px]" style={{ ...displayStyle(c), top: TOGGLE.top + TOGGLE.h + 32, color: muted }}>
        {c.name}
      </p>
    </div>
  )
}

/** Two thin capsule rails either side of the toggle, filling with the gradient as it switches on. */
function ToggleRails({ c, on }: { c: SceneProps['c']; on: MotionValue<number> }) {
  const s = useStage()
  const top = TOGGLE.top + (TOGGLE.h - RAIL.h) / 2
  const width = s.cx - TOGGLE.w / 2 - RAIL.gap - RAIL.inset
  const track = mix(c.theme.dark.heroInk, 12)
  return (
    <>
      <Capsule c={c} fill={on} track={track} style={{ left: RAIL.inset, top, width, height: RAIL.h }} />
      <Capsule c={c} fill={on} track={track} style={{ left: s.cx + TOGGLE.w / 2 + RAIL.gap, top, width, height: RAIL.h }} />
    </>
  )
}
