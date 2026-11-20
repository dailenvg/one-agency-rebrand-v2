import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { MockupPhoto } from '../data/mockups'
import { overlay, photoSwap, press, spring } from '../lib/motion'
import { altOf, photoLayoutId, titleOf, usePhotoLoad } from '../lib/photos'

interface LightboxProps {
  photos: MockupPhoto[]
  /** Open photo, or null when closed. */
  index: number | null
  onIndex: (index: number | null) => void
  /** Same scope the section's thumbnails use for their layoutIds. */
  scope: string
}

/** Pixels a horizontal swipe must travel to move to the next or previous photo. */
const SWIPE_PX = 60

/**
 * Full-screen viewer for a set of photos. The opened photo grows out of its thumbnail and shrinks back into it on
 * close. Arrow keys and swipes move through the set, Escape or the backdrop closes, focus stays inside while open and
 * returns to the thumbnail after, and the page behind does not scroll.
 */
export function Lightbox({ photos, index, onIndex, scope }: LightboxProps) {
  return createPortal(
    <AnimatePresence>{index !== null && photos[index] && <LightboxDialog key="lightbox" photos={photos} index={index} onIndex={onIndex} scope={scope} />}</AnimatePresence>,
    document.body,
  )
}

function LightboxDialog({ photos, index, onIndex, scope }: LightboxProps & { index: number }) {
  const reduce = useReducedMotion()
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const captionId = useId()
  // Only the photo the lightbox opened on shares a layoutId, so stepping through the set never pulls thumbnails along.
  const [origin] = useState(index)
  const [direction, setDirection] = useState(0)
  const photo = photos[index]
  const many = photos.length > 1

  const close = () => onIndex(null)
  const step = (by: 1 | -1) => {
    if (!many) return
    setDirection(reduce ? 0 : by)
    onIndex((index + by + photos.length) % photos.length)
  }

  useScrollLock()
  useFocusReturn(closeButton)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
    else if (e.key === 'Tab') trapFocus(e, dialog.current)
    else return
    if (e.key !== 'Tab') e.preventDefault()
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_PX) step(1)
    else if (info.offset.x >= SWIPE_PX) step(-1)
  }

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={captionId} tabIndex={-1} onKeyDown={onKeyDown} className="fixed inset-0 z-[90] flex flex-col text-white outline-none">
      <motion.div aria-hidden className="absolute inset-0 bg-black/90 backdrop-blur-md" variants={overlay} initial="hidden" animate="show" exit="exit" onClick={close} />

      <Chrome className="justify-between pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="label text-white/70">{many ? `${index + 1} / ${photos.length}` : ''}</p>
        <RoundButton ref={closeButton} label="Close" onClick={close}>
          <X size={20} weight="bold" />
        </RoundButton>
      </Chrome>

      {/*
       * Clicks on the empty stage around the photo close, like the backdrop. The stage is a size container, so the
       * photo fits the space actually left between the two bars (safe-area insets and a two-line caption included)
       * and never runs under the caption.
       */}
      <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center px-4 py-3 [container-type:size] sm:px-8" onClick={(e) => e.target === e.currentTarget && close()}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={photo.slug}
            custom={direction}
            variants={photoSwap}
            initial="enter"
            animate="center"
            exit="exit"
            className="pointer-events-none flex size-full items-center justify-center [grid-area:1/1]"
          >
            <motion.div drag={many ? 'x' : false} dragSnapToOrigin onDragEnd={onDragEnd} className="pointer-events-auto touch-pan-y" style={{ width: `min(100cqw, calc(100cqh * ${photo.width / photo.height}))` }}>
              <LightboxPhoto photo={photo} layoutId={!reduce && index === origin ? photoLayoutId(scope, photo.slug) : undefined} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Chrome className="justify-between gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p id={captionId} aria-live="polite" className="min-w-0 text-sm font-medium text-pretty text-white/85 sm:text-base">
          {titleOf(photo)}
        </p>
        {many && (
          <div className="flex shrink-0 gap-2">
            <RoundButton label="Previous image" onClick={() => step(-1)}>
              <CaretLeft size={20} weight="bold" />
            </RoundButton>
            <RoundButton label="Next image" onClick={() => step(1)}>
              <CaretRight size={20} weight="bold" />
            </RoundButton>
          </div>
        )}
      </Chrome>
    </div>
  )
}

/** The photo at its own aspect ratio, over its small size so the frame is never empty while the full size loads. */
function LightboxPhoto({ photo, layoutId }: { photo: MockupPhoto; layoutId?: string }) {
  const load = usePhotoLoad(photo)
  return (
    <motion.div
      layoutId={layoutId}
      transition={spring.layout}
      className="relative overflow-hidden rounded-brand-md bg-white/5 bg-cover bg-center shadow-lift"
      style={{ aspectRatio: `${photo.width} / ${photo.height}`, backgroundImage: `url("${photo.srcSm}")` }}
    >
      {load.state === 'failed' ? (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
          <p className="text-sm text-white/80">The full-size image could not load.</p>
          <RoundButton label="Try again" onClick={load.retry} wide>
            Try again
          </RoundButton>
        </div>
      ) : (
        <img
          key={load.attempt}
          src={load.src}
          srcSet={load.srcSet}
          sizes="100vw"
          width={photo.width}
          height={photo.height}
          alt={altOf(photo)}
          decoding="async"
          draggable={false}
          onLoad={load.onLoad}
          onError={load.onError}
          className="size-full object-cover"
        />
      )}
    </motion.div>
  )
}

function Chrome({ className, children }: { className: string; children: ReactNode }) {
  return (
    <motion.div
      variants={overlay}
      initial="hidden"
      animate="show"
      exit="exit"
      className={`relative flex items-center pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] ${className}`}
    >
      {children}
    </motion.div>
  )
}

interface RoundButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
  /** A text button rather than an icon. */
  wide?: boolean
  ref?: Ref<HTMLButtonElement>
}

function RoundButton({ label, onClick, children, wide = false, ref }: RoundButtonProps) {
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={wide ? undefined : label}
      title={wide ? undefined : label}
      className={`grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/20 transition-colors ring-inset hover:bg-white/22 focus-visible:outline-white ${wide ? 'px-5 text-sm font-semibold' : ''}`}
      {...press}
    >
      {children}
    </motion.button>
  )
}

/** Locks page scroll while mounted, keeping the scrollbar's width so the page behind does not shift. */
function useScrollLock() {
  useEffect(() => {
    const root = document.documentElement
    const gutter = window.innerWidth - root.clientWidth
    const before = { overflow: root.style.overflow, paddingRight: root.style.paddingRight }
    root.style.overflow = 'hidden'
    if (gutter) root.style.paddingRight = `${gutter}px`
    return () => {
      root.style.overflow = before.overflow
      root.style.paddingRight = before.paddingRight
    }
  }, [])
}

/** Moves focus into the dialog on open and back to whatever opened it on close. */
function useFocusReturn(target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    target.current?.focus({ preventScroll: true })
    return () => opener?.focus({ preventScroll: true })
  }, [target])
}

/** Keeps Tab and Shift+Tab cycling through the dialog's controls. */
function trapFocus(e: KeyboardEvent, root: HTMLElement | null) {
  const focusable = root ? [...root.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')] : []
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}
