import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { useTheme } from '../theme/context'
import { contrast } from './color'

/**
 * Ring classes for an accent-filled state indicator (the active V pill, the mode switch thumb) on the nav's track.
 * Where the accent alone falls under 3:1 against the track (lime, yellow or green on a pale bar; cobalt or violet on
 * a dark hero), an ink edge carries the shape instead, per WCAG 1.4.11. Empty when the fill already reads.
 */
export function useAccentEdge(onHero: boolean) {
  const { concept, mode } = useTheme()
  const t = concept.theme[mode]
  if (contrast(t.accent, onHero ? t.heroBg : t.surface2) >= 3) return ''
  return `ring-1 ring-inset ${onHero ? 'ring-hero-ink' : 'ring-ink'}`
}

/** Id of the section currently crossing the upper third of the viewport. */
export function useScrollSpy(ids: string[], rootMargin = '-35% 0px -60% 0px') {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids, rootMargin])
  return active
}

/**
 * True once the element with this id has scrolled out of view, and false again when it comes back. The top edge is
 * the page's scroll-padding-top, the band a fixed header covers, so an anchor jump that parks the element's last
 * pixels under the header still counts as scrolled past.
 */
export function useScrolledPast(id: string) {
  const [past, setPast] = useState(false)
  const tablet = useMediaQuery('(min-width: 768px)')
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el) return
    // One extra pixel: an element that only touches the edge, as an anchor jump leaves it, still counts as intersecting.
    const inset = (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) + 1
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: `-${inset}px 0px 0px 0px` })
    io.observe(el)
    return () => io.disconnect()
  }, [id, tablet])
  return past
}

/**
 * True while the element is on screen and the tab is visible. Gate endless loops on this so off-screen motion never
 * competes with scrolling for frames.
 */
export function useOnScreen<T extends Element>(ref: RefObject<T | null>, margin = '0px') {
  const [onScreen, setOnScreen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  const visible = useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange)
      return () => document.removeEventListener('visibilitychange', onChange)
    },
    () => document.visibilityState === 'visible',
  )
  return onScreen && visible
}

/** Live result of a CSS media query. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => matchMedia(query).matches,
  )
}
