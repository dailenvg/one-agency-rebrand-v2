import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ThemeContext } from './context'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { conceptById, type Concept, type ConceptId, type Mode } from '../data/concepts'
import { iconUri, logoUrl } from '../lib/logos'
import { duration, ease } from '../lib/motion'
import { takePendingScroll } from '../lib/nav'

/** The wipe stays up at least this long so the logo card reads, and never longer than the max while assets load. */
const WIPE_MIN_HOLD_MS = 240
const WIPE_MAX_HOLD_MS = 900

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
/** Resolves after the browser has painted the current state (two frames: commit, then paint). */
const nextPaint = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* storage unavailable: the page still works, it just forgets */
  }
}

/** Shown when neither the URL nor storage names a current concept (none, an unknown id, or a retired one). */
const DEFAULT_CONCEPT: ConceptId = 'nova'

const isConceptId = (v: string | null): v is ConceptId => v !== null && Object.hasOwn(conceptById, v)

function initialConcept(): ConceptId {
  const saved = new URLSearchParams(location.search).get('concept') ?? read('oa-concept')
  return isConceptId(saved) ? saved : DEFAULT_CONCEPT
}

function applyTokens(c: Concept, mode: Mode) {
  const t = c.theme[mode]
  const root = document.documentElement
  const vars: Record<string, string> = {
    '--c-bg': t.bg, '--c-surface': t.surface, '--c-surface2': t.surface2, '--c-ink': t.ink, '--c-muted': t.muted,
    '--c-line': t.line, '--c-accent': t.accent, '--c-accent-ink': t.accentInk, '--c-accent-text': t.accentText,
    '--c-accent2': t.accent2, '--c-hero': t.heroBg, '--c-hero-ink': t.heroInk, '--c-glow': t.glow,
    '--g-brand': c.gradient, '--f-display': c.type.display.stack, '--f-display-weight': String(c.type.display.weight),
    '--f-display-stretch': c.type.display.stretch ?? '100%', '--f-display-tracking': c.type.display.tracking ?? '-0.02em', '--f-display-scale': String(c.type.display.scale ?? 1),
    '--r-sm': `${Math.min(c.radius.sm, 999)}px`, '--r-md': `${c.radius.md}px`, '--r-lg': `${c.radius.lg}px`,
  }
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.dataset.mode = mode
  root.dataset.concept = c.id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.heroBg)
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link) link.href = iconUri(c.id, c.favicon, { size: 64, radius: 0.22 })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ConceptId>(initialConcept)
  const [mode, setMode] = useState<Mode>(() => (read('oa-mode') as Mode) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [wipeTo, setWipeTo] = useState<ConceptId | null>(null)
  const reduce = useReducedMotion()
  const concept = conceptById[id]

  useEffect(() => {
    applyTokens(concept, mode)
    write('oa-concept', id)
    write('oa-mode', mode)
    const url = new URL(location.href)
    url.searchParams.set('concept', id)
    history.replaceState(null, '', url)
  }, [concept, id, mode])

  const select = useCallback(
    (next: ConceptId) => {
      if (next === id || wipeTo) return false
      if (reduce) {
        setId(next)
        return false
      }
      setWipeTo(next)
      return true
    },
    [id, reduce, wipeTo],
  )

  /**
   * Runs once the wipe fully covers the page: swap the concept, wait until the new identity is actually painted (its
   * display face and logo loaded, React committed), make any pending jump, then lift. A fixed delay here used to lift
   * the wipe onto a page still re-rendering or swapping fonts, which read as a stutter.
   */
  const swapUnderWipe = useCallback(async (next: Concept) => {
    const started = performance.now()
    setId(next.id)
    const logo = new Image()
    logo.src = logoUrl(next.id, 'primary', 'dark')
    const ready = Promise.all([
      document.fonts.load(`${next.type.display.weight} 1em ${next.type.display.stack}`).catch(() => undefined),
      logo.decode().catch(() => undefined),
    ])
    await Promise.race([ready, wait(WIPE_MAX_HOLD_MS)])
    await nextPaint()
    const target = takePendingScroll()
    if (target) {
      document.getElementById(target)?.scrollIntoView({ behavior: 'instant' })
      await nextPaint()
    }
    await wait(Math.max(0, WIPE_MIN_HOLD_MS - (performance.now() - started)))
    setWipeTo(null)
  }, [])

  const value = useMemo(
    () => ({
      concept,
      mode,
      select,
      toggleMode: () => {
        const next: Mode = mode === 'light' ? 'dark' : 'light'
        const run = () => {
          // Tokens first, then the React state, both inside the snapshot, so the whole page changes as one frame.
          applyTokens(concept, next)
          flushSync(() => setMode(next))
        }
        // One crossfade for the whole page. Without it the body faded while every surface snapped, which read as flicker.
        if (!reduce && document.startViewTransition) document.startViewTransition(run)
        else run()
      },
    }),
    [concept, mode, select, reduce],
  )

  const target = wipeTo ? conceptById[wipeTo] : null

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {target && (
          <motion.div
            key={target.id}
            aria-hidden
            className="fixed inset-0 z-[100] grid place-items-center"
            style={{ background: target.theme.dark.heroBg }}
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)', transition: { duration: duration.wipe / 2, ease: ease.emphasized } }}
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: duration.wipe / 2, ease: ease.emphasized } }}
            onAnimationComplete={(def) => {
              if (typeof def === 'object' && 'clipPath' in def && def.clipPath === 'inset(0% 0 0 0)') void swapUnderWipe(target)
            }}
          >
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.1, duration: duration.component, ease: ease.out } }}
              exit={{ opacity: 0, transition: { duration: duration.micro } }}
            >
              <img src={logoUrl(target.id, 'primary', 'dark')} alt="" className="h-20 w-auto max-w-[70vw] sm:h-28" />
              <span className="label text-white/60">
                Concept {target.index} · {target.name}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ThemeContext.Provider>
  )
}

