import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type Transition } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent, type Ref } from 'react'
import { concepts, type Concept, type ConceptId } from '../data/concepts'
import { logoUrl } from '../lib/logos'
import { goToKit } from '../lib/nav'
import { conceal, press, reveal, rise, spring, stagger, viewport } from '../lib/motion'
import { displayStyle } from '../lib/type'
import { useTheme } from '../theme/context'
import { PaletteBar } from './ui/PaletteBar'

/** Flex share of the open panel; every closed panel takes 1. */
const OPEN_GROW = 5
const GAP = 6
const COUNT = concepts.length

/**
 * Panel widths as CSS, so each content layer can hold a fixed width while its panel resizes
 * around it. That keeps text and logos from reflowing or stretching mid-animation.
 * `--strip-w` is the strip's measured width (set by a ResizeObserver); 100vw is only a first-paint fallback.
 */
const stripStyle = {
  '--closed-w': `calc((var(--strip-w, 100vw) - ${GAP * (COUNT + 1)}px) / ${OPEN_GROW + COUNT - 1})`,
  '--open-w': `calc(var(--closed-w) * ${OPEN_GROW})`,
  gap: GAP,
  paddingInline: GAP,
} as CSSProperties

const keySteps: Record<string, (i: number) => number> = {
  ArrowRight: (i) => i + 1,
  ArrowDown: (i) => i + 1,
  ArrowLeft: (i) => i - 1,
  ArrowUp: (i) => i - 1,
  Home: () => 0,
  End: () => COUNT - 1,
}

/** Layout children share the panel's spring so their scale correction stays in step. */
const layer = (shown: boolean): Transition => ({ layout: spring.layout, opacity: shown ? reveal : conceal })

/** One full-height panel per concept across the viewport. Hover, focus or tap opens one; the applied concept is open at rest. */
export function ConceptStrip() {
  const { concept: applied, select } = useTheme()
  const [preview, setPreview] = useState<ConceptId | null>(null)
  const open = preview ?? applied.id
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const strip = useRef<HTMLUListElement>(null)
  const radius = Math.min(applied.radius.md, 28)

  /** Measure the strip itself, so classic scrollbars never make the content layers wider than their panels. */
  useLayoutEffect(() => {
    const el = strip.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => el.style.setProperty('--strip-w', `${entry.borderBoxSize[0].inlineSize}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const step = keySteps[e.key]
    if (!step) return
    e.preventDefault()
    buttons.current[(step(i) + COUNT) % COUNT]?.focus()
  }

  const onBlur = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPreview(null)
  }

  return (
    <div className="relative overflow-hidden">
      <motion.ul
        ref={strip}
        aria-label="Concepts"
        variants={stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setPreview(null)}
        onBlur={onBlur}
        className="flex h-[clamp(520px,88vh,860px)]"
        style={stripStyle}
      >
        {concepts.map((c, i) => (
          <Panel
            key={c.id}
            c={c}
            open={open === c.id}
            applied={applied.id === c.id}
            radius={radius}
            buttonRef={(el) => {
              buttons.current[i] = el
            }}
            onPreview={() => setPreview(c.id)}
            onApply={() => goToKit(select, c.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          />
        ))}
      </motion.ul>
    </div>
  )
}

interface PanelProps {
  c: Concept
  open: boolean
  applied: boolean
  radius: number
  buttonRef: Ref<HTMLButtonElement>
  onPreview: () => void
  onApply: () => void
  onKeyDown: (e: KeyboardEvent) => void
}

function Panel({ c, open, applied, radius, buttonRef, onPreview, onApply, onKeyDown }: PanelProps) {
  const d = c.theme.dark
  const reduce = useReducedMotion()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const logoX = useSpring(useTransform(px, [-0.5, 0.5], [-18, 18]), spring.soft)
  const logoY = useSpring(useTransform(py, [-0.5, 0.5], [-12, 12]), spring.soft)
  /** The action pill is decoration inside the panel button, so the button drives its hover and press scale. */
  const pill = useSpring(1, spring.snappy)
  const hovered = useRef(false)
  const setPill = (scale: number) => !reduce && pill.set(scale)
  const actionId = `concept-action-${c.id}`
  const chip = { background: `color-mix(in srgb, ${d.heroInk} 14%, transparent)` }

  /** The logo leans toward the pointer, so the open panel reads as live and clickable. */
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (reduce || !open) return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onPointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse') return
    hovered.current = true
    setPill(press.whileHover.scale)
    onPreview()
  }
  const onPointerLeave = () => {
    hovered.current = false
    setPill(1)
    px.set(0)
    py.set(0)
  }

  return (
    <motion.li
      layout
      variants={rise}
      transition={{ layout: spring.layout }}
      className="relative min-w-0 basis-0 overflow-hidden"
      style={{ flexGrow: open ? OPEN_GROW : 1, borderRadius: radius, background: d.heroBg, color: d.heroInk }}
    >
      <button
        ref={buttonRef}
        type="button"
        tabIndex={open ? 0 : -1}
        aria-pressed={applied}
        aria-label={`Concept ${c.index}, ${c.name}. ${c.tagline}`}
        aria-describedby={actionId}
        onPointerEnter={onPointerEnter}
        onPointerDown={() => setPill(press.whileTap.scale)}
        onPointerUp={() => setPill(hovered.current ? press.whileHover.scale : 1)}
        onFocus={onPreview}
        onClick={() => (open ? onApply() : onPreview())}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="absolute inset-0 cursor-pointer overflow-hidden rounded-[inherit] text-left focus-visible:outline-offset-[-6px]"
        style={{ outlineColor: d.heroInk }}
      >
        <motion.span
          layout
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 flex w-[var(--closed-w)] flex-col items-center justify-between py-6"
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={layer(!open)}
        >
          <span className="label opacity-60">{c.index}</span>
          <img src={logoUrl(c.id, 'mark', 'dark')} alt="" className="h-10 w-auto max-w-[56%] object-contain" />
          <span
            className="display-slot rotate-180 text-[calc(clamp(1.5rem,2.6vw,2.75rem)*var(--x-scale))] whitespace-nowrap [writing-mode:vertical-rl]"
            style={displayStyle(c)}
          >
            {c.name}
          </span>
        </motion.span>

        <motion.span
          layout
          aria-hidden
          className="absolute inset-y-0 left-0 flex w-[var(--open-w)] flex-col p-[clamp(20px,2.6vw,44px)]"
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={layer(open)}
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="label rounded-[3px] px-2 py-1 leading-none" style={{ background: d.accent, color: d.accentInk }}>
              Concept {c.index}
            </span>
            {applied && (
              <span className="label rounded-[3px] px-2 py-1 leading-none" style={chip}>
                Applied
              </span>
            )}
            <span className="label ml-auto hidden opacity-60 lg:inline">{c.graphic.name}</span>
          </span>

          <span className="relative grid min-h-0 flex-1 place-items-center py-6">
            <motion.img
              src={logoUrl(c.id, 'primary', 'dark')}
              alt=""
              style={{ x: logoX, y: logoY }}
              className="relative h-[clamp(72px,16vh,150px)] w-auto max-w-[78%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
            />
          </span>

          <span className="flex flex-col gap-5">
            <span>
              <span className="display-slot block text-[calc(clamp(2.4rem,4.4vw,4.6rem)*var(--x-scale))]" style={displayStyle(c)}>
                {c.name}
              </span>
              <span className="mt-2 block text-lead opacity-80">{c.tagline}</span>
              <span className="mt-3 hidden max-w-[46ch] text-sm opacity-65 lg:block">{c.idea}</span>
            </span>
            <PaletteBar c={c} className="h-2" />
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span className="label opacity-70">{c.type.display.family}</span>
              <motion.span
                id={actionId}
                style={{ scale: pill, background: d.accent, color: d.accentInk }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                {applied ? 'Open the brand kit' : 'Apply & open kit'} <ArrowRight size={16} />
              </motion.span>
            </span>
          </span>
        </motion.span>
      </button>

      {applied && (
        <motion.span
          layoutId="concept-applied"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
          style={{ background: d.accent }}
          transition={spring.layout}
        />
      )}
    </motion.li>
  )
}
