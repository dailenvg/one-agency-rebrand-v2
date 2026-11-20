import type { AppIcon, ConceptId, Mode } from '../data/concepts'
import { inkOn } from './color'

export type LogoKind = 'primary' | 'alt' | 'mark'

/**
 * The lockup for a wide, short slot such as the nav. It is each concept's widest full lockup, which is the alt for most.
 * Nova's alt is the ONE wordmark alone, and ONE never appears without "agency", so Nova uses its one-line primary.
 */
export const wideLogo = (id: ConceptId): LogoKind => (id === 'nova' ? 'primary' : 'alt')

/**
 * Only the current concepts' folders, so retired artwork left in src/assets/logos never ships. Keep in step with
 * ConceptId; a missing folder shows up as a broken logo for that concept.
 */
const urls = import.meta.glob<string>('../assets/logos/{nova,volt,pill,arc}/*.svg', { eager: true, query: '?url', import: 'default' })
/** Only the marks are inlined as text: they get recoloured and composed into icons. */
const raws = import.meta.glob<string>('../assets/logos/{nova,volt,pill,arc}/mark-*.svg', { eager: true, query: '?raw', import: 'default' })

const key = (id: ConceptId, kind: LogoKind, mode: Mode) => `../assets/logos/${id}/${kind}-${mode}.svg`

/** Logo variant that reads on a given background colour. */
export const modeOn = (bg: string): Mode => (inkOn(bg) === '#FFFFFF' ? 'dark' : 'light')

export function logoUrl(id: ConceptId, kind: LogoKind, mode: Mode) {
  return urls[key(id, kind, mode)]
}

export function markRatio(id: ConceptId, mode: Mode) {
  const m = raws[key(id, 'mark', mode)].match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/)
  return m ? Number(m[1]) / Number(m[2]) : 1
}

function recolor(svg: string, map: Record<string, string> = {}) {
  return Object.entries(map).reduce((s, [from, to]) => s.replace(new RegExp(from, 'gi'), to), svg)
}

export function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Raw mark artwork, optionally recoloured, as a data URI. */
export function markUri(id: ConceptId, mode: Mode, map?: Record<string, string>) {
  return svgDataUri(recolor(raws[key(id, 'mark', mode)], map))
}

/** Square app icon: the mark centred on a rounded tile, padded to the mark's proportions. */
export function iconSvg(id: ConceptId, icon: AppIcon, { size = 512, radius = 0.225 } = {}) {
  const mark = recolor(raws[key(id, 'mark', icon.mode)], icon.recolor)
  const ratio = markRatio(id, icon.mode)
  const box = size * (ratio > 1.6 ? 0.7 : 0.56)
  const w = ratio >= 1 ? box : box * ratio
  const h = ratio >= 1 ? box / ratio : box
  const inner = mark
    .replace(/<svg[^>]*?viewBox="([^"]+)"[^>]*>/, (_, vb) => `<svg x="${(size - w) / 2}" y="${(size - h) / 2}" width="${w}" height="${h}" viewBox="${vb}">`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * radius}" fill="${icon.bg}"/>${inner.replace(/^<svg[^>]*xmlns="[^"]+"/, '<svg')}</svg>`
}

export function iconUri(id: ConceptId, icon: AppIcon, opts?: { size?: number; radius?: number }) {
  return svgDataUri(iconSvg(id, icon, opts))
}
