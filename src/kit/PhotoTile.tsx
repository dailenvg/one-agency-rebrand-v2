import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { MockupPhoto } from '../data/mockups'
import { packRows, type RowRule } from '../lib/bento'
import { conceal, fadeUp, photoZoom, pulse, spring, stagger, tap, viewport } from '../lib/motion'
import { altOf, photoLayoutId, usePhotoLoad } from '../lib/photos'

interface PhotoTileProps {
  photo: MockupPhoto
  /** Chip in the top left corner, as on every kit tile. */
  label?: ReactNode
  /** Hide the chip below 640px, where a small tile's chip would cover its headline. The lightbox caption still names it. */
  labelFromSm?: boolean
  /** The `sizes` attribute: how wide the tile renders at each breakpoint. */
  sizes: string
  /** Shared with the lightbox frame for layout continuity. Leave unset under reduced motion. */
  layoutId?: string
  /** `object-position` for a frame that crops the photo (see `focusOf`). Centre by default. */
  focus?: string
  onOpen: () => void
  className?: string
  style?: CSSProperties
}

/**
 * A photo that opens in the lightbox. A breathing skeleton holds its place until it loads, and a failed load offers a
 * retry instead of a broken image.
 */
export function PhotoTile({ photo, label, labelFromSm = false, sizes, layoutId, focus, onOpen, className = '', style }: PhotoTileProps) {
  const load = usePhotoLoad(photo)
  return (
    <figure className={`relative min-h-0 min-w-0 ${className}`} style={style}>
      {load.state === 'failed' ? (
        <PhotoError onRetry={load.retry} />
      ) : (
        <motion.button
          type="button"
          onClick={onOpen}
          aria-label={`View full size: ${altOf(photo)}`}
          className="absolute inset-0 cursor-zoom-in rounded-brand-md"
          initial="rest"
          animate="rest"
          whileHover="hover"
          {...tap}
        >
          <motion.span layoutId={layoutId} transition={spring.layout} className="absolute inset-0 overflow-hidden rounded-brand-md bg-surface2 shadow-soft">
            <motion.img
              key={load.attempt}
              variants={photoZoom}
              src={load.src}
              srcSet={load.srcSet}
              sizes={sizes}
              width={photo.width}
              height={photo.height}
              alt={altOf(photo)}
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={load.onLoad}
              onError={load.onError}
              className="size-full object-cover"
              style={focus ? { objectPosition: focus } : undefined}
            />
            <AnimatePresence>{load.state === 'loading' && <PhotoSkeleton key="skeleton" />}</AnimatePresence>
          </motion.span>
        </motion.button>
      )}
      {label && (
        <figcaption
          className={`label pointer-events-none absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/85 px-2.5 py-1 text-[10px] text-black/70 backdrop-blur ${labelFromSm ? 'max-sm:hidden' : ''}`}
        >
          {label}
        </figcaption>
      )}
    </figure>
  )
}

/** Under reduced motion the skeleton holds still: MotionConfig only stops transforms, and this loop is opacity. */
function PhotoSkeleton() {
  const reduce = useReducedMotion()
  return (
    <motion.span aria-hidden className="absolute inset-0 bg-surface2" exit={{ opacity: 0, transition: conceal }}>
      <motion.span className="absolute inset-0 bg-ink/8" animate={reduce ? { opacity: 0.6 } : { opacity: [0.4, 1, 0.4] }} transition={reduce ? undefined : pulse} />
    </motion.span>
  )
}

/** Row rules per breakpoint: below 640px, from 640px, from 1024px. A missing rule falls back to the one below it. */
export interface RowRules {
  base: RowRule
  sm?: RowRule
  lg?: RowRule
}

/** Matches the list's `gap-3`. */
const GAP_PX = 12

/**
 * A photo's width in its row: its share of the row once the gaps are out, less half a pixel so sub-pixel rounding
 * never wraps the last photo early. `grow` on the item hands the half pixel back.
 */
const rowWidth = ({ share, count }: { share: number; count: number }) => `calc((100% - ${(count - 1) * GAP_PX}px) * ${share.toFixed(5)} - 0.5px)`
const rowVw = (share: number) => `${Math.max(10, Math.round(share * 100))}vw`

interface PhotoRowsProps {
  photos: MockupPhoto[]
  rules: RowRules
  /** layoutId scope shared with this list's Lightbox. */
  scope: string
  label: (photo: MockupPhoto) => ReactNode
  onOpen: (index: number) => void
  /** The list's width from 1024px as a share of the full row, for `sizes`, when a layout narrows it. Full by default. */
  lgWidth?: number
  className?: string
}

/**
 * Photos in justified rows (see `packRows`): every photo at its own aspect ratio, so none is cropped, and each row
 * fills the width at one height. Each tile's width and aspect ratio are set before load, so nothing shifts.
 */
export function PhotoRows({ photos, rules, scope, label, onOpen, lgWidth = 1, className = '' }: PhotoRowsProps) {
  const reduce = useReducedMotion()
  const ratios = photos.map((p) => p.width / p.height)
  const base = packRows(ratios, rules.base)
  const sm = rules.sm ? packRows(ratios, rules.sm) : base
  const lg = rules.lg ? packRows(ratios, rules.lg) : sm
  return (
    <motion.ul variants={stagger(0.07)} initial="hidden" whileInView="show" viewport={viewport} className={`flex flex-wrap items-start gap-3 ${className}`}>
      {photos.map((p, i) => (
        <motion.li
          key={p.slug}
          variants={fadeUp}
          className="min-w-0 grow w-(--w) sm:w-(--w-sm) lg:w-(--w-lg)"
          style={{ '--w': rowWidth(base[i]), '--w-sm': rowWidth(sm[i]), '--w-lg': rowWidth(lg[i]), aspectRatio: `${p.width} / ${p.height}` } as CSSProperties}
        >
          <PhotoTile
            photo={p}
            label={label(p)}
            labelFromSm
            sizes={`(min-width: 1024px) ${rowVw(lg[i].share * lgWidth)}, (min-width: 640px) ${rowVw(sm[i].share)}, ${rowVw(base[i].share)}`}
            layoutId={reduce ? undefined : photoLayoutId(scope, p.slug)}
            onOpen={() => onOpen(i)}
            className="size-full"
          />
        </motion.li>
      ))}
    </motion.ul>
  )
}

function PhotoError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-brand-md bg-surface2 p-4 text-center shadow-soft">
      <p className="text-sm text-muted">This image could not load.</p>
      <motion.button
        type="button"
        onClick={onRetry}
        className="min-h-11 cursor-pointer rounded-full bg-ink px-5 text-sm font-semibold text-bg transition-colors hover:bg-ink/85"
        {...tap}
      >
        Try again
      </motion.button>
    </div>
  )
}
