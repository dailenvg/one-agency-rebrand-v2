import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { Fragment, memo, useEffect, useRef, useState, type CSSProperties } from 'react'
import { concepts, type Concept, type ConceptId } from '../data/concepts'
import { useOnScreen } from '../lib/hooks'
import { logoUrl } from '../lib/logos'
import { spring } from '../lib/motion'
import { displayStyle } from '../lib/type'
import { useTheme } from '../theme/context'

/**
 * Agenciex-style cylinder carousel. Each card is cut into vertical slices placed around a ring,
 * so the cards bend with the cylinder. Faces are double sided so the far side reads correctly.
 */

interface Card {
  concept: Concept
  face: 'logo' | 'poster'
}

const cards: Card[] = concepts.flatMap((c) => [
  { concept: c, face: 'logo' as const },
  { concept: c, face: 'poster' as const },
])

const N = cards.length
const STEP = 360 / N
const ARC = STEP * 0.86
const SLICES = 7
const TILT = -17

function useStage() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1200)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const radius = Math.min(Math.max(w * (w < 640 ? 0.58 : 0.4), 180), 620)
  const cardW = radius * ((ARC * Math.PI) / 180)
  const cardH = cardW * 1.18
  const perspective = radius * 4.2
  // Project the nearest and farthest card so the stage hugs the tilted ring.
  const t = (-TILT * Math.PI) / 180
  const near = perspective / (perspective - radius * Math.cos(t))
  const far = perspective / (perspective + radius * Math.cos(t))
  const top = radius * Math.sin(t) * far + (cardH / 2) * far
  const bottom = radius * Math.sin(t) * near + (cardH / 2) * near
  return { ref, radius, cardW, cardH, perspective, top, height: top + bottom + 24 }
}

export function ConceptRing() {
  const { concept: active, select } = useTheme()
  const rotation = useMotionValue(0)
  const reduce = useReducedMotion()
  const dragging = useRef(false)
  const moved = useRef(0)
  const hovered = useRef(false)
  const { ref, radius, cardW, cardH, perspective, top, height } = useStage()
  const ringTransform = useTransform(rotation, (r) => `rotateX(${TILT}deg) rotateY(${r}deg)`)
  const onScreen = useOnScreen(ref)

  useAnimationFrame((_, delta) => {
    // Off screen the ring idles, so its 3D transform never competes with scrolling. Clamp delta so a long frame
    // (tab switch, heavy render) can't jump the ring.
    if (reduce || !onScreen || dragging.current || hovered.current) return
    delta = Math.min(delta, 50)
    rotation.set(rotation.get() - delta * 0.005)
  })

  /** Bring a concept's logo card to the front. */
  const focus = (id: ConceptId) => {
    const i = cards.findIndex((c) => c.concept.id === id && c.face === 'logo')
    const centre = -(i * STEP + ARC / 2)
    const delta = ((((centre - rotation.get()) % 360) + 540) % 360) - 180
    animate(rotation, rotation.get() + delta, spring.soft)
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        className="relative mx-auto w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={{ height }}
        onPointerEnter={() => (hovered.current = true)}
        onPointerLeave={() => (hovered.current = false)}
      >
        <motion.div
          className="absolute inset-0"
          style={{ perspective, perspectiveOrigin: `50% ${top}px` }}
          onPanStart={() => {
            dragging.current = true
            moved.current = 0
          }}
          onPan={(_, info) => {
            moved.current += Math.abs(info.delta.x)
            rotation.set(rotation.get() + info.delta.x * (52 / radius))
          }}
          onPanEnd={(_, info) => {
            animate(rotation, rotation.get() + info.velocity.x * (8 / radius), { type: 'spring', velocity: info.velocity.x * (52 / radius), stiffness: 40, damping: 22 })
            setTimeout(() => (dragging.current = false), 60)
          }}
        >
          <div aria-hidden className="absolute bottom-[2%] left-1/2 h-[14%] w-[70%] -translate-x-1/2 rounded-[50%] bg-black/50 blur-2xl" />
          <motion.div className="absolute left-1/2" style={{ top, transformStyle: 'preserve-3d', transform: ringTransform }}>
            {cards.map((card, i) => (
              <RingCard
                key={`${card.concept.id}-${card.face}`}
                card={card}
                start={i * STEP}
                radius={radius}
                width={cardW}
                height={cardH}
                selected={active.id === card.concept.id}
                onSelect={() => moved.current < 6 && select(card.concept.id)}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      <ul className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:inset-x-0 focus-within:bottom-0 focus-within:flex focus-within:flex-wrap focus-within:justify-center focus-within:gap-2">
        {concepts.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              aria-pressed={active.id === c.id}
              onFocus={() => focus(c.id)}
              onClick={() => select(c.id)}
              className="min-h-11 rounded-full bg-white/10 px-4 text-sm text-hero-ink"
            >
              Apply concept {c.index}, {c.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const RingCard = memo(function RingCard({
  card, start, radius, width, height, selected, onSelect,
}: {
  card: Card; start: number; radius: number; width: number; height: number; selected: boolean; onSelect: () => void
}) {
  const sliceAngle = ARC / SLICES
  const sliceW = width / SLICES
  return (
    <>
      {Array.from({ length: SLICES }).map((_, s) => {
        const angle = start + (s + 0.5) * sliceAngle
        const base: CSSProperties = {
          position: 'absolute',
          left: -sliceW / 2 - 0.5,
          top: -height / 2,
          width: sliceW + 1,
          height,
          overflow: 'hidden',
          backfaceVisibility: 'hidden',
          cursor: 'pointer',
        }
        return (
          <Fragment key={s}>
            <div aria-hidden onClick={onSelect} style={{ ...base, transform: `rotateY(${angle}deg) translateZ(${radius}px)` }}>
              <Face card={card} width={width} height={height} offset={s * sliceW} selected={selected} />
            </div>
            <div aria-hidden onClick={onSelect} style={{ ...base, transform: `rotateY(${angle}deg) translateZ(${radius}px) rotateY(180deg)` }}>
              <Face card={card} width={width} height={height} offset={(SLICES - 1 - s) * sliceW} selected={selected} />
            </div>
          </Fragment>
        )
      })}
    </>
  )
})

function Face({ card, width, height, offset, selected }: { card: Card; width: number; height: number; offset: number; selected: boolean }) {
  const { concept: c, face } = card
  const d = c.theme.dark
  const l = c.theme.light
  const u = width / 100
  // Micro labels only where the card is big enough to read them.
  const labels = u >= 2.2
  // The poster's name block, measured so the mark slot always stops above it, whatever the face's optical scale.
  const nameSize = u * 13 * (c.type.display.scale ?? 1)
  const nameBottom = u * 9
  const markBottom = nameBottom + nameSize * 1.15 + u * 6
  return (
    <div
      className="absolute top-0 overflow-hidden"
      style={{
        left: -offset,
        width,
        height,
        borderRadius: u * 7,
        background: face === 'logo' ? d.heroBg : l.bg,
        color: face === 'logo' ? d.heroInk : l.ink,
        boxShadow: selected ? `inset 0 0 0 ${Math.max(2, u * 1.1)}px ${d.glow}` : undefined,
      }}
    >
      {face === 'logo' ? (
        <>
          <div className="absolute -bottom-[45%] left-1/2 size-[120%] -translate-x-1/2 rounded-full opacity-40 blur-2xl" style={{ background: d.glow }} />
          {labels && (
            <span className="absolute font-mono uppercase opacity-60" style={{ top: u * 6, left: u * 7, fontSize: u * 3.6, letterSpacing: '0.12em' }}>
              Concept {c.index}
            </span>
          )}
          {/* Sized by the slot, never by the SVG's intrinsic pixels, so every lockup proportion lands the same way. */}
          <div className="absolute" style={{ inset: `${u * 16}px ${u * 14}px` }}>
            <img
              src={logoUrl(c.id, 'primary', 'dark')}
              alt=""
              draggable={false}
              className="absolute inset-0 m-auto size-full object-contain"
              style={{ maxHeight: u * 42 }}
            />
          </div>
          {labels && (
            <span className="absolute font-mono uppercase opacity-60" style={{ bottom: u * 6, left: u * 7, fontSize: u * 3.6, letterSpacing: '0.12em' }}>
              {c.tagline}
            </span>
          )}
        </>
      ) : (
        <>
          {labels && (
            <span className="absolute inset-x-0 text-center font-mono uppercase" style={{ top: u * 8, fontSize: u * 3.4, letterSpacing: '0.32em', color: l.muted }}>
              {c.graphic.name} · {c.index}
            </span>
          )}
          {/* Between the label and the name; tall marks are capped so they carry the same weight as wide ones. */}
          <div className="absolute" style={{ top: u * 20, bottom: markBottom, left: u * 12, right: u * 12 }}>
            <img
              src={logoUrl(c.id, 'mark', 'light')}
              alt=""
              draggable={false}
              className="absolute inset-0 m-auto size-full object-contain"
              style={{ maxHeight: u * 54 }}
            />
          </div>
          <span className="absolute inset-x-0 text-center leading-none" style={{ ...displayStyle(c), bottom: nameBottom, fontSize: nameSize }}>
            {c.name}
          </span>
          <div className="absolute inset-x-0 bottom-0" style={{ height: u * 2.4, background: c.gradient }} />
        </>
      )}
    </div>
  )
}
