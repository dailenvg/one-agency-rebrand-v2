import { motion } from 'motion/react'
import { useId } from 'react'
import { company } from '../../../data/concepts'
import { markRatio, markUri } from '../../../lib/logos'
import { reel } from '../../../lib/motion'
import { displayStyle } from '../../../lib/type'
import { mix, range, softShadow, useDrift, useSettle, type SceneProps } from '../scene-kit'
import { centred, column, isWide, useStage } from '../stage'

/* Repeat field: the ONE mark tiled in offset rows, green on cobalt, flowing off every edge. A pool of cobalt clears
   the centre for the locked mark. */

const FIELD = { w: 132, gap: 172, row: 80, rows: 4, cols: 3, tint: 0.3, pool: { w: 300, h: 200 } }

export function LoopFieldScene({ c, p }: SceneProps) {
  const { accent: cobalt } = c.theme.light
  const s = useStage()
  // Enough tiles each side to cover the stage through the whole drift.
  const cols = Math.max(FIELD.cols, Math.ceil(s.cx / FIELD.gap))
  const x = useDrift(p, 0, -FIELD.gap)
  const h = FIELD.w / markRatio(c.id, 'dark')
  const href = markUri(c.id, 'dark')
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: cobalt }}>
      <motion.svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full overflow-visible" style={{ x }}>
        {range(FIELD.rows * 2 + 1).map((i) => {
          const r = i - FIELD.rows
          const shift = Math.abs(r) % 2 ? FIELD.gap / 2 : 0
          return range(cols * 2 + 2).map((k) => (
            <image
              key={`${r}-${k}`}
              href={href}
              x={s.cx + (k - cols) * FIELD.gap + shift - FIELD.w / 2}
              y={s.cy + r * FIELD.row - h / 2}
              width={FIELD.w}
              height={h}
              opacity={FIELD.tint}
            />
          ))
        })}
      </motion.svg>
      <span className="absolute" style={{ ...centred(s, FIELD.pool.w, FIELD.pool.h), background: `radial-gradient(closest-side, ${cobalt} 55%, ${mix(cobalt, 0)})` }} />
    </div>
  )
}

/* The reply: a question comes in above the mark, and the answer is already typing below it. */

const BUBBLE = { question: 128, reply: 396, typed: 0.32, caption: 566 }
/** The thread's column on narrow stages, so a tablet frame keeps the bubbles in conversation distance. */
const THREAD = { max: 420 }
/**
 * On a wide stage the question sits left of the mark and the answer right of it, read across: `gap` from the centre
 * line, with tops measured from the centre.
 */
const BESIDE = { gap: 92, question: -96, reply: 4 }

/** Splits the concept's social sample ("@handle: question? answer") into its parts. */
function thread(text: string) {
  const [handle, message] = text.split(/: (.*)/s)
  const turn = message.indexOf('? ') + 1
  return { handle, question: message.slice(0, turn), reply: message.slice(turn).trim() }
}

export function LoopReplyScene({ c, p }: SceneProps) {
  const { surface, surface2, bg, ink, muted, accent, accentInk } = c.theme.light
  const { handle, question, reply } = thread(c.voice.samples.find((s) => s.label === 'Social')?.text ?? '')
  const inY = useSettle(p, 16, 0, 0, reel.settle / 2)
  const inOpacity = useSettle(p, 0, 1, 0, reel.settle / 2)
  const typing = useSettle(p, 1, 0, BUBBLE.typed, reel.stagger)
  const replyScale = useSettle(p, 0.85, 1, BUBBLE.typed, reel.settle / 2)
  const replyOpacity = useSettle(p, 0, 1, BUBBLE.typed, reel.stagger)
  const bubble = 'max-w-[230px] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-snug'
  const s = useStage()
  const wide = isWide(s)
  const frame = wide ? { left: 0, width: s.w } : column(s, 0, THREAD.max)
  const asked = wide ? { right: s.w - s.cx + BESIDE.gap, top: s.cy + BESIDE.question } : { top: BUBBLE.question }
  const answered = wide ? { left: s.cx + BESIDE.gap, top: s.cy + BESIDE.reply } : { top: BUBBLE.reply }
  // The reply's tail points back at the mark: bottom left beside it, bottom right on the narrow thread.
  const tail = wide ? 'origin-bottom-left rounded-bl-md' : 'right-5 origin-bottom-right rounded-br-md'
  return (
    <div className="absolute inset-0" style={{ background: surface, fontFamily: c.type.body.stack }}>
      <div className="absolute inset-y-0" style={frame}>
        <motion.div className={`absolute flex items-end gap-2 ${wide ? '' : 'left-5'}`} style={{ ...asked, y: inY, opacity: inOpacity }}>
          <span className="size-7 shrink-0 rounded-full" style={{ background: surface2 }} />
          <div>
            <p className="mb-1 text-[10px] font-semibold" style={{ color: muted }}>{handle}</p>
            <p className={`${bubble} rounded-bl-md`} style={{ background: bg, color: ink, boxShadow: softShadow }}>{question}</p>
          </div>
        </motion.div>
        <motion.div className={`absolute flex gap-1 rounded-[18px] px-3.5 py-3.5 ${tail}`} style={{ ...answered, background: accent, opacity: typing }}>
          {range(3).map((i) => (
            <span key={i} className="size-1.5 rounded-full" style={{ background: accentInk, opacity: 0.5 + i * 0.25 }} />
          ))}
        </motion.div>
        <motion.p className={`${bubble} absolute ${tail}`} style={{ ...answered, background: accent, color: accentInk, scale: replyScale, opacity: replyOpacity }}>
          {reply}
        </motion.p>
      </div>
      <p className="absolute inset-x-0 text-center text-[11px]" style={{ top: BUBBLE.caption, color: muted }}>
        {c.voice.say[2]}
      </p>
      <p className="absolute inset-x-0 text-center text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ top: 36, color: muted }}>
        {company.name}
      </p>
    </div>
  )
}

/* Always on: the closing card. The tagline runs round the mark on a ring that never stops turning, and one green
   stroke draws the loop closed. */

const ORBIT = { r: 118, size: 15, ring: 148, stroke: 3, turn: 48, repeat: 3, box: 340 }
/** Fainter orbits a wide stage rings round the closing card, out past its edges. */
const OUTER = { step: 96, tint: 16, dash: '2 7' }

export function LoopOrbitScene({ c, p }: SceneProps) {
  const { heroBg, heroInk, accent2: green } = c.theme.dark
  const id = `orbit-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  const rotate = useDrift(p, 0, ORBIT.turn)
  const pathLength = useSettle(p, 0, 1)
  const y = useSettle(p, 14, 0, reel.stagger * 2)
  const opacity = useSettle(p, 0, 1, reel.stagger * 2)
  const s = useStage()
  const { cx, cy } = s
  const half = ORBIT.box / 2
  const outer = isWide(s) ? range(Math.ceil((cx - ORBIT.ring) / OUTER.step)).map((k) => ORBIT.ring + (k + 1) * OUTER.step) : []
  return (
    <div className="absolute inset-0" style={{ background: heroBg }}>
      <svg viewBox={`0 0 ${s.w} ${s.h}`} className="absolute inset-0 size-full" fill="none">
        {outer.map((r) => (
          <motion.circle key={r} cx={cx} cy={cy} r={r} stroke={mix(heroInk, OUTER.tint)} strokeDasharray={OUTER.dash} style={{ opacity: pathLength }} />
        ))}
        <motion.circle
          cx={cx}
          cy={cy}
          r={ORBIT.ring}
          stroke={green}
          strokeWidth={ORBIT.stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ pathLength }}
        />
      </svg>
      <motion.svg viewBox={`${-half} ${-half} ${ORBIT.box} ${ORBIT.box}`} className="absolute" style={{ ...centred(s, ORBIT.box), rotate }}>
        <defs>
          <path id={id} d={`M 0 ${-ORBIT.r} A ${ORBIT.r} ${ORBIT.r} 0 1 1 -0.01 ${-ORBIT.r}`} />
        </defs>
        <text fill={heroInk} style={{ ...displayStyle(c), fontSize: ORBIT.size, letterSpacing: '0.08em' }}>
          <textPath href={`#${id}`} textLength={2 * Math.PI * ORBIT.r} lengthAdjust="spacing">
            {range(ORBIT.repeat).map((i) => (
              <tspan key={i}>
                {c.tagline}
                <tspan fill={green}> ● </tspan>
              </tspan>
            ))}
          </textPath>
        </text>
      </motion.svg>
      <motion.p className="absolute inset-x-0 text-center text-[34px] leading-none" style={{ ...displayStyle(c), top: cy + ORBIT.ring + 44, color: heroInk, y, opacity }}>
        {c.name}
      </motion.p>
    </div>
  )
}
