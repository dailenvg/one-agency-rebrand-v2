// Converts the photo mockups in public/Mockups/<folder>/*.png to WebP in public/mockup-photos/<concept>/ (a full size
// up to 1600px wide and an 800px `-sm` size per image) and writes the typed manifest src/data/mockups.ts.
// The output folder is not public/mockups: on a case-insensitive file system that is the same folder as the sources.
// The local ffmpeg build has no libwebp encoder, so headless Chromium (Playwright, as in export-reels) resizes and
// encodes each image instead.
// Usage: npm run build:mockups
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { availableParallelism } from 'node:os'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const SRC_DIR = resolve('public/Mockups')
const OUT_DIR = resolve('public/mockup-photos')
const MANIFEST = resolve('src/data/mockups.ts')
/** URL prefix of the outputs under public/, and the fake origin the browser fetches sources from. */
const OUT_URL = 'mockup-photos'
const ORIGIN = 'http://mockups.local'

/** Source folder per concept, in concept order. `v1` really is lowercase; `v2a` holds the nova mockups. */
const FOLDERS = [
  ['v2a', 'nova'],
  ['v1', 'volt'],
  ['V3', 'pill'],
  ['V4', 'arc'],
]
/** Source PNGs that are not mockups, keyed by `<folder>/<file>`: left in place, never converted. */
const SKIP = new Set(['v2a/ONE agency black wordmark.png'])
const SIZES = { full: 1600, sm: 800 }
const QUALITY = 0.8

/** First match on the cleaned title wins, so environments claim "capsule exhibition stand" before merch sees "capsule". */
const KIND_RULES = [
  ['environment', /\b(reception|booth|stand|loft|pavilion|pop-up|installation)\b/i],
  ['print', /\b(stationery|brochure|pass)\b/i],
  ['merch', /\b(merch|merchandise|streetwear|capsule collection)\b/i],
  ['social', /\b(social|grid|six-panel|six-tile|six-card|showcase|icon)\b/i],
  ['poster', /\b(posters?|triptych)\b/i],
  ['art', /(wave|ribbon|prism|dissolv|muse|visor|dreamscape|refract|sculpt|glass)/i],
]
/** Order of kinds within a concept. The first image of the gallery kinds is the Mockups hero. */
const KIND_ORDER = ['environment', 'print', 'merch', 'poster', 'social', 'art']

/** Sources whose filename does not say what they show, keyed by `<folder>/<file>`. */
const OVERRIDES = {
  'v1/Make Your Mark_ One Agency-1.png': { kind: 'poster' },
  'v1/One Agency_ Endless Possibilities-5.png': { kind: 'poster' },
}

/** Curly apostrophes to straight ones, so prefixes match however the generator typed them. */
const straighten = (s) => s.replace(/[’‘]/g, "'")

const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** The trailing "-N" or " (N)" the generator added, kept only for ordering. */
const sequence = (name) => Number(name.match(/(?:-(\d+)|\s\((\d+)\))$/)?.slice(1).find(Boolean) ?? 0)

/** "ONE agency’s bold digital poster trio-4.png" becomes "Bold digital poster trio". */
function titleOf(file) {
  const bare = straighten(file.replace(/\.png$/i, ''))
    .replace(/(?:-\d+|\s\(\d+\))$/, '')
    .replace(/^one agency(?:'s)?_?\s+/i, '')
    .replace(/_\s*one agency$/i, '')
    .trim()
  return bare.charAt(0).toUpperCase() + bare.slice(1).toLowerCase()
}

const slugOf = (title) =>
  title
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function kindOf(title, key) {
  const match = KIND_RULES.find(([, rule]) => rule.test(title))
  if (!match) throw new Error(`${key}: no kind rule matches "${title}". Add a rule or an override.`)
  return match[0]
}

async function plan() {
  const jobs = []
  for (const [folder, concept] of FOLDERS) {
    const files = (await readdir(join(SRC_DIR, folder))).filter((f) => f.toLowerCase().endsWith('.png') && !SKIP.has(`${folder}/${f}`))
    const slugs = new Set()
    for (const file of files) {
      const key = `${folder}/${file}`
      const override = OVERRIDES[key] ?? {}
      const title = override.title ?? titleOf(file)
      const slug = override.slug ?? slugOf(title)
      if (slugs.has(slug)) throw new Error(`${key}: slug "${slug}" is already used in ${concept}. Add an override.`)
      slugs.add(slug)
      jobs.push({ key, concept, slug, title, kind: override.kind ?? kindOf(title, key), order: sequence(file.replace(/\.png$/i, '')) })
    }
  }
  const stale = Object.keys(OVERRIDES).filter((key) => !jobs.some((j) => j.key === key))
  if (stale.length) throw new Error(`Overrides match no source file: ${stale.join(', ')}`)
  return jobs
}

/** Runs in the page: decodes the source once, then resizes and encodes every size. Returns base64 WebP per size. */
async function encodeInPage({ url, sizes, quality }) {
  const blob = await (await fetch(url)).blob()
  const probe = await createImageBitmap(blob)
  const toBase64 = (bytes) => {
    let s = ''
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return btoa(s)
  }
  const out = {}
  for (const [name, max] of Object.entries(sizes)) {
    const width = Math.min(max, probe.width)
    const height = Math.round((probe.height * width) / probe.width)
    const bitmap = await createImageBitmap(blob, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' })
    const canvas = new OffscreenCanvas(width, height)
    canvas.getContext('2d').drawImage(bitmap, 0, 0)
    const webp = await canvas.convertToBlob({ type: 'image/webp', quality })
    if (webp.type !== 'image/webp') throw new Error('This browser cannot encode WebP')
    out[name] = { width, height, data: toBase64(new Uint8Array(await webp.arrayBuffer())) }
  }
  return out
}

async function convert(page, job) {
  const url = `${ORIGIN}/${encodeURIComponent(job.key)}`
  const sizes = await page.evaluate(encodeInPage, { url, sizes: SIZES, quality: QUALITY })
  const base = join(OUT_DIR, job.concept, job.slug)
  const full = Buffer.from(sizes.full.data, 'base64')
  const sm = Buffer.from(sizes.sm.data, 'base64')
  await writeFile(`${base}.webp`, full)
  await writeFile(`${base}-sm.webp`, sm)
  return { ...job, width: sizes.full.width, height: sizes.full.height, widthSm: sizes.sm.width, bytes: full.length + sm.length }
}

async function openPage(browser) {
  const page = await browser.newPage()
  await page.route(`${ORIGIN}/**`, (route) => {
    const key = decodeURIComponent(new URL(route.request().url()).pathname.slice(1))
    return key ? route.fulfill({ path: join(SRC_DIR, key), contentType: 'image/png' }) : route.fulfill({ body: '' })
  })
  await page.goto(`${ORIGIN}/`)
  return page
}

/** Converts every job across a few pages at once. */
async function convertAll(browser, jobs) {
  const queue = [...jobs]
  const done = []
  const worker = async () => {
    const page = await openPage(browser)
    for (let job = queue.shift(); job; job = queue.shift()) done.push(await convert(page, job))
    await page.close()
  }
  await Promise.all(Array.from({ length: Math.min(4, availableParallelism()) }, worker))
  return done
}

const byPlace = (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.order - b.order || a.title.localeCompare(b.title)

function manifest(photos) {
  const entry = (p) => {
    const path = `${p.concept}/${p.slug}`
    return `    { slug: '${p.slug}', src: at('${path}.webp'), srcSm: at('${path}-sm.webp'), width: ${p.width}, height: ${p.height}, widthSm: ${p.widthSm}, title: ${quote(p.title)}, kind: '${p.kind}' },`
  }
  const groups = FOLDERS.map(([, concept]) => {
    const rows = photos.filter((p) => p.concept === concept).sort(byPlace).map(entry)
    return `  ${concept}: [\n${rows.join('\n')}\n  ],`
  })
  return `// Generated by scripts/build-mockups.mjs from the PNGs in public/Mockups. Do not edit by hand: change the mapping in
// the script and run \`npm run build:mockups\`.
import type { ConceptId } from './concepts'

export type MockupKind = ${KIND_ORDER.map((k) => `'${k}'`).join(' | ')}

export interface MockupPhoto {
  slug: string
  /** WebP up to ${SIZES.full}px wide. */
  src: string
  /** WebP up to ${SIZES.sm}px wide, for srcSet. */
  srcSm: string
  width: number
  height: number
  widthSm: number
  /** Plain title from the source filename, the starting point for alt text. */
  title: string
  kind: MockupKind
}

const at = (path: string) => \`\${import.meta.env.BASE_URL}${OUT_URL}/\${path}\`

/** Each concept's photos, environments first, in the order the gallery shows them. */
export const mockups: Record<ConceptId, MockupPhoto[]> = {
${groups.join('\n')}
}
`
}

const jobs = await plan()
// Only the listed concepts' folders are rebuilt: anything else under OUT_DIR (retired concepts, source drops) stays.
await Promise.all(
  FOLDERS.map(async ([, concept]) => {
    await rm(join(OUT_DIR, concept), { recursive: true, force: true })
    await mkdir(join(OUT_DIR, concept), { recursive: true })
  }),
)
const browser = await chromium.launch()
try {
  const photos = await convertAll(browser, jobs)
  await writeFile(MANIFEST, manifest(photos))
  for (const [, concept] of FOLDERS) {
    const mine = photos.filter((p) => p.concept === concept)
    const kb = mine.reduce((sum, p) => sum + p.bytes, 0) / 1024
    console.log(`${concept}: ${mine.length} photos, ${kb.toFixed(0)} KB`)
  }
  const total = photos.reduce((sum, p) => sum + p.bytes, 0)
  console.log(`${photos.length} photos, ${(total / 1024 / 1024).toFixed(2)} MB in ${OUT_DIR}`)
} finally {
  await browser.close()
}
