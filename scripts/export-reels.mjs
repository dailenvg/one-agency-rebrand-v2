// Renders each concept's logo reel frame by frame in headless Chromium and encodes it to GIF: the 9:16 reel to
// public/reels/<id>.gif and the 16:9 logo banner to public/reels/<id>-banner.gif.
// Usage: npm run export:reels [-- nova volt] [-- --banner | --portrait]   (defaults to every concept, both formats)
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const IDS = ['nova', 'volt', 'pill', 'arc']
/** 20 fps is a whole number of GIF centiseconds (5) and puts every cut exactly on a frame. */
const FPS = 20
const MB = 1024 * 1024
/**
 * Per format: the file suffix, output widths to try as shares of the export width (src/kit/reel/stage.ts), largest
 * first, and the size budget the GIF must fit. The banner steps run 960, 800, 640 pixels wide.
 */
const FORMATS = {
  portrait: { suffix: '', steps: [1, 0.8, 2 / 3], maxBytes: 3 * MB },
  banner: { suffix: '-banner', steps: [1, 5 / 6, 2 / 3], maxBytes: 5 * MB },
}
const FFMPEG = process.env.FFMPEG ?? '/opt/homebrew/bin/ffmpeg'
const OUT_DIR = resolve('public/reels')

const run = promisify(execFile)

const wholeFrames = (seconds) => Math.abs(seconds * FPS - Math.round(seconds * FPS)) < 1e-6

/** One page per device pixel ratio, since the banner is captured supersampled. */
function pages(browser) {
  const open = new Map()
  return async (density) => {
    if (!open.has(density)) open.set(density, await browser.newPage({ deviceScaleFactor: density }))
    return open.get(density)
  }
}

async function load(page, url) {
  await page.goto(url)
  await page.waitForFunction(() => window.reelExport)
  return page.evaluate(() => window.reelExport)
}

async function captureFrames(pageAt, baseUrl, id, format, dir) {
  const url = `${baseUrl}?reel=${id}&format=${format}`
  const probe = await pageAt(1)
  const harness = await load(probe, url)
  const { loop, scene, width, height, density } = harness
  if (!wholeFrames(scene)) throw new Error(`Scene length ${scene}s is not a whole number of frames at ${FPS} fps`)
  if (!wholeFrames(loop)) throw new Error(`${id}: loop length ${loop}s is not a whole number of frames at ${FPS} fps`)
  const page = await pageAt(density)
  if (page !== probe) await load(page, url)
  await page.setViewportSize({ width, height })

  // Each concept has its own loop length, so the frame count comes from its reel.
  const frames = Math.round(loop * FPS)
  const reel = page.locator('#reel-export')
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.reelExport.seek(t), i / FPS)
    await reel.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`) })
  }
  return { frames, width }
}

async function encode(dir, out, width) {
  const filters = [
    `scale=${width}:-2:flags=lanczos`,
    'split[a][b]',
    '[a]palettegen=stats_mode=diff:max_colors=256[p]',
    '[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle',
  ]
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-filter_complex', filters.join(','), '-loop', '0', out])
  return (await stat(out)).size
}

async function exportReel(pageAt, baseUrl, id, format) {
  const { suffix, steps, maxBytes } = FORMATS[format]
  const name = `${id}${suffix}`
  const dir = await mkdtemp(join(tmpdir(), `reel-${name}-`))
  try {
    const { frames, width: full } = await captureFrames(pageAt, baseUrl, id, format, dir)
    const out = join(OUT_DIR, `${name}.gif`)
    for (const step of steps) {
      // Even widths keep the height a whole number of pixels after scale=-2.
      const width = Math.round((full * step) / 2) * 2
      const bytes = await encode(dir, out, width)
      if (bytes <= maxBytes || step === steps.at(-1)) {
        const mb = (bytes / MB).toFixed(2)
        console.log(`${name}: ${frames} frames (${(frames / FPS).toFixed(2)} s) at ${FPS} fps, ${width}px wide, ${mb} MB${bytes > maxBytes ? ' (over budget)' : ''}`)
        return
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const args = process.argv.slice(2)
const flags = args.filter((a) => a.startsWith('--')).map((a) => a.slice(2))
const ids = args.filter((a) => !a.startsWith('--'))
const formats = Object.keys(FORMATS).filter((f) => !flags.length || flags.includes(f))
await mkdir(OUT_DIR, { recursive: true })
const server = await createServer({ logLevel: 'error', server: { port: 5199 } })
await server.listen()
const browser = await chromium.launch()
try {
  // Resized to the export size once the harness reports it.
  const pageAt = pages(browser)
  const baseUrl = server.resolvedUrls.local[0]
  for (const id of ids.length ? ids : IDS) {
    for (const format of formats) await exportReel(pageAt, baseUrl, id, format)
  }
} finally {
  await browser.close()
  await server.close()
}
