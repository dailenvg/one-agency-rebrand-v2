import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { concepts } from '../../data/concepts'
import { reel } from '../../lib/motion'
import { reelFor } from '../../lib/reel'
import { LogoReel } from '../LogoReel'
import { EXPORT, type ReelFormat } from './stage'

declare global {
  interface Window {
    /** Driven by scripts/export-reels.mjs. */
    reelExport?: { loop: number; scene: number; width: number; height: number; density: number; seek: (time: number) => Promise<void> }
  }
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** `&format=banner` exports the 16:9 logo banner; anything else, the 9:16 reel. */
const formatFromUrl = (): ReelFormat => (new URLSearchParams(location.search).get('format') === 'banner' ? 'banner' : 'portrait')

/** Dev-only harness: one concept's reel at export size, with time set from outside so every captured frame is exact. */
export function ReelExport({ id, format = formatFromUrl() }: { id: string; format?: ReelFormat }) {
  const c = concepts.find((x) => x.id === id)
  const [time, setTime] = useState(0)
  const size = EXPORT[format]

  useEffect(() => {
    if (!c) return
    window.reelExport = {
      loop: reelFor(c.id).loop,
      scene: reel.scene,
      width: size.w,
      height: size.h,
      density: size.density,
      seek: async (t) => {
        flushSync(() => setTime(t))
        await nextFrame()
        await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)))
        await document.fonts.ready
        await nextFrame()
        await nextFrame()
      },
    }
    return () => {
      delete window.reelExport
    }
  }, [c, size])

  if (!c) return <p>No concept with id “{id}”.</p>
  return (
    <div id="reel-export" style={format === 'banner' ? { width: size.w, height: size.h } : { width: size.w }}>
      <LogoReel c={c} time={time} fluid={format === 'banner'} />
    </div>
  )
}
