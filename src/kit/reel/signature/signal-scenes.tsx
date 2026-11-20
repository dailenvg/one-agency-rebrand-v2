import { motion } from 'motion/react'
import { useMemo } from 'react'
import { company } from '../../../data/concepts'
import { markRatio, markUri } from '../../../lib/logos'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { range, useDrift, useSettle, type SceneProps } from '../scene-kit'
import { column, extraWidth, STAGE, useStage, type Stage } from '../stage'

/** Condensed capitals at a given size, in the concept's display face. */
const caps = (c: SceneProps['c'], size: number) => ({ ...displayStyle(c), fontSize: `calc(${size}px * var(--x-scale))`, textTransform: 'uppercase' as const })

/* Oversized crop: the carved one cropped huge off the bottom right, notch first, on fog. The mark is the one orange
   moment, and the principle is set in the condensed caps. The crop stays anchored to the right edge at any width. */

const CROP = { w: 600, right: STAGE.w - 140, top: 384, rise: 96, grow: 1.05, widen: 720 }

/** The crop grows with the stage's extra width, so the carved one still dominates its corner of a wide frame. */
const cropScale = (s: Stage) => 1 + extraWidth(s) / CROP.widen
const PRINCIPLE = { inset: 24, max: 640 }

export function SignalCropScene({ c, p }: SceneProps) {
  const { surface2: fog, ink } = c.theme.light
  const s = useStage()
  const k = cropScale(s)
  const y = useSettle(p, CROP.rise, 0)
  const scale = useDrift(p, 1, CROP.grow)
  const words = useSettle(p, 20, 0, reel.stagger)
  const opacity = useSettle(p, 0, 1, reel.stagger)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: fog }}>
      <motion.img
        src={markUri(c.id, 'light')}
        alt=""
        className="absolute max-w-none origin-top-left"
        style={{ left: s.w - CROP.right * k, top: CROP.top, width: CROP.w * k, height: (CROP.w * k) / markRatio(c.id, 'light'), y, scale }}
      />
      <motion.p className="absolute leading-[0.82]" style={{ ...caps(c, 64), left: PRINCIPLE.inset, width: column(s, PRINCIPLE.inset, PRINCIPLE.max).width, top: 72, color: ink, y: words, opacity }}>
        {c.graphic.principles[0]}
      </motion.p>
    </div>
  )
}

/* Business to Human: the positioning set one word per line in condensed caps, cropped by the frame and drifting in
   alternate directions. Human, under the mark, is the orange word. A wide stage repeats each word along its line,
   the echoes quieter, so the frame still crops every line. */

const LINE = { size: 96, last: 128, drift: 28, tops: [62, 162, 392], gap: '0.3em', echo: 0.18, per: 160 }

/** Repeats of a word either side of it, enough to run past both edges of the stage. */
const echoes = (s: Stage) => Math.ceil(extraWidth(s) / LINE.per)

function CapsLine({ c, p, word, top, size, color, order }: SceneProps & { word: string; top: number; size: number; color: string; order: number }) {
  const s = useStage()
  const dir = order % 2 ? -1 : 1
  const x = useDrift(p, dir * LINE.drift, -dir * LINE.drift)
  const n = echoes(s)
  const echo = (key: string) => (
    <span key={key} style={{ opacity: LINE.echo, paddingInline: LINE.gap }}>
      {word}
    </span>
  )
  return (
    <motion.p className="absolute flex justify-center leading-[0.8] whitespace-nowrap" style={{ left: -s.w, right: -s.w, top, color, x, ...caps(c, size) }}>
      {n ? [...range(n).map((i) => echo(`before-${i}`)), <span key="word" style={{ paddingInline: LINE.gap }}>{word}</span>, ...range(n).map((i) => echo(`after-${i}`))] : word}
    </motion.p>
  )
}

export function SignalCapsScene({ c, p }: SceneProps) {
  const { surface2: fog, ink, muted, accent } = c.theme.light
  const [lead, tail] = company.positioning.split(' · ')
  const words = lead.split(' ')
  const last = words.length - 1
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: fog, fontFamily: c.type.body.stack }}>
      {words.map((word, i) => (
        <CapsLine key={word} c={c} p={p} word={word} order={i} top={LINE.tops[i]} size={i === last ? LINE.last : LINE.size} color={i === last ? accent : ink} />
      ))}
      <p className="absolute inset-x-0 text-center text-[11px] font-semibold tracking-[0.24em] uppercase" style={{ top: 584, color: muted }}>
        {tail}
      </p>
    </div>
  )
}

/* The notch: the closing card on signal orange. A black slab rises with the notch of the carved one cut into its
   edge, and the tagline sits above in condensed caps. */

/** The slab's notch sits just right of centre: `cutFrom` and `cutTo` are measured from the stage's centre line. */
const SLAB = { low: 452, high: 400, cutFrom: 14, cutTo: 62, rise: 250 }
const TAGLINE = { inset: 24, max: 600 }

function slabPoints(s: Stage) {
  const from = s.cx + SLAB.cutFrom
  const to = s.cx + SLAB.cutTo
  return `-10,${SLAB.low} ${from},${SLAB.low} ${to},${SLAB.high} ${s.w + 10},${SLAB.high} ${s.w + 10},${s.h + 10} -10,${s.h + 10}`
}

export function SignalNotchScene({ c, p }: SceneProps) {
  const { accent, ink } = c.theme.light
  const { heroInk } = c.theme.dark
  const s = useStage()
  const slab = useMemo(() => slabPoints(s), [s])
  const y = useSettle(p, SLAB.rise, 0)
  const copy = useSettle(p, 18, 0, reel.stagger)
  const opacity = useSettle(p, 0, 1, reel.stagger)
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: accent }}>
      <motion.p className="absolute text-center leading-[0.84] text-balance" style={{ ...caps(c, 54), ...column(s, TAGLINE.inset, TAGLINE.max), top: 104, color: ink, y: copy, opacity }}>
        {c.tagline}
      </motion.p>
      <motion.svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" style={{ y }}>
        <polygon points={slab} fill={ink} />
        <text x={s.cx} y={560} textAnchor="middle" fill={heroInk} style={caps(c, 40)}>
          {c.name}
        </text>
      </motion.svg>
    </div>
  )
}
