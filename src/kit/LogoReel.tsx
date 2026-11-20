import { Pause, Play } from '@phosphor-icons/react'
import { cancelFrame, frame, motion, useInView, useMotionValue, useMotionValueEvent, useTransform, type FrameData, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode, type RefObject } from 'react'
import type { Concept } from '../data/concepts'
import { useMediaQuery } from '../lib/hooks'
import { markUri } from '../lib/logos'
import { press, reel } from '../lib/motion'
import { reelFor, sceneAt, sceneSpan, type Reel } from '../lib/reel'
import { cutIns, markMoves, type CutStyle, type MarkMove } from './reel/concept-motion'
import { settleEase, type SceneProps } from './reel/scene-kit'
import { scenes } from './reel/scene-table'
import { centred, fluidWidth, ICON_RADIUS, MARK, PLATE, STAGE, StageProvider, stageOf, useStage, type MarkLook } from './reel/stage'

interface LogoReelProps {
  c: Concept
  /** Show the reel at this exact time in seconds, with no clock and no controls. Used by the GIF export. */
  time?: number
  /** Called with the scene index at every cut. */
  onScene?: (index: number) => void
  /**
   * Fill the container and widen the stage to its aspect, cover-fitting the rest, instead of the fixed 9:16 artboard.
   * The container must have a height.
   */
  fluid?: boolean
  /** What the reel is called in its accessible label and play control. */
  name?: string
  /** Lays out the overlay controls around the play toggle. Without it the toggle sits in the bottom right corner. */
  controls?: (toggle: ReactNode) => ReactNode
  className?: string
}

/** Round glass control that reads on light and dark scenes alike, with a focus ring that does too. */
export const reelControl =
  'grid size-11 cursor-pointer place-items-center rounded-full bg-black/50 text-white ring-1 ring-white/25 backdrop-blur transition-colors ring-inset hover:bg-black/70 focus-visible:shadow-[0_0_0_6px_rgb(0_0_0/0.7)] focus-visible:outline-white'

/**
 * A logo reel, 9:16 or fluid: the mark stays locked at the centre while the world around it hard-cuts through scenes
 * built from the concept's own idea, mixed with app, web and print applications. Each concept has its own scenes, cut
 * and mark move. Plays while on screen; reduced motion starts on the settled closing card.
 */
export function LogoReel(props: LogoReelProps) {
  // Another concept is another reel, so its clock and scene start fresh.
  return <ReelPlayer key={props.c.id} {...props} />
}

function ReelPlayer({ c, time, onScene, fluid = false, name = 'logo reel', controls, className = '' }: LogoReelProps) {
  const plan = reelFor(c.id)
  const box = useRef<HTMLDivElement>(null)
  const { w, scale, x, y } = useStageFit(box, fluid)
  const stage = useMemo(() => stageOf(w), [w])
  const inView = useInView(box)
  // Live media query rather than motion's useReducedMotion, which reads the setting once at mount.
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const controlled = time !== undefined
  const [playing, togglePlay] = usePlayChoice(reduce)
  const t = useMotionValue(time ?? (reduce ? plan.poster : 0))
  const [index, setIndex] = useState(() => sceneAt(plan, t.get()))

  useMotionValueEvent(t, 'change', (v) => setIndex(sceneAt(plan, v)))
  useLayoutEffect(() => {
    if (time !== undefined) t.jump(time)
  }, [t, time])
  /** Reduced motion switched on mid-visit: settle on the still rather than freezing mid-move. */
  useEffect(() => {
    if (reduce && !controlled && !playChoice?.reduce) t.jump(plan.poster)
  }, [reduce, controlled, t, plan])
  useClock(t, plan.loop, !controlled && playing && inView)
  useEffect(() => onScene?.(index), [index, onScene])

  const count = plan.scenes.length
  const scene = plan.scenes[index]
  const previous = plan.scenes[(index + count - 1) % count]
  const { start, length } = sceneSpan(plan, index)
  const previousLength = previous.beats * reel.scene
  const cutIn = cutIns[c.id]
  const label = `${c.name} ${name}, a ${plan.loop.toFixed(1)} second loop: ${plan.scenes.map((s) => s.label).join(', ')}`
  const playToggle = <PlayToggle name={name} playing={playing} onToggle={togglePlay} className={controls ? '' : 'absolute right-3 bottom-3'} />

  return (
    <div className={`relative ${fluid ? 'size-full' : 'aspect-[9/16] w-full'} ${className}`}>
      <div ref={box} role="img" aria-label={label} className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 origin-top-left overflow-hidden" style={{ width: stage.w, height: stage.h, transform: `translate(${x}px, ${y}px) scale(${scale})` }}>
          <StageProvider value={stage}>
            {/* The outgoing scene stays mounted, settled, under the incoming one while the cut wipes it in. */}
            <SceneClip key={previous.id} c={c} t={t} start={start - previousLength} length={previousLength} Scene={scenes[previous.id].Scene} cutIn={cutIn} until={start + reel.cut} />
            <SceneClip key={scene.id} c={c} t={t} start={start} length={length} Scene={scenes[scene.id].Scene} cutIn={cutIn} />
            <LockedMark c={c} plan={plan} look={scenes[scene.id].mark(c)} t={t} start={start} move={scene.move ? markMoves[c.id] : undefined} />
          </StageProvider>
        </div>
      </div>
      {!controlled && (controls ? controls(playToggle) : playToggle)}
    </div>
  )
}

/**
 * The viewer's play or pause choice. It lives outside the component so it survives the remount on every concept
 * switch, and it only counts under the reduced-motion setting it was made with, so turning reduced motion on
 * mid-visit pauses the reel even after an earlier "play".
 */
let playChoice: { playing: boolean; reduce: boolean } | null = null
const playListeners = new Set<() => void>()
const subscribePlay = (listener: () => void) => {
  playListeners.add(listener)
  return () => void playListeners.delete(listener)
}
const readPlay = () => playChoice

function usePlayChoice(reduce: boolean) {
  const choice = useSyncExternalStore(subscribePlay, readPlay, readPlay)
  const playing = choice && choice.reduce === reduce ? choice.playing : !reduce
  const toggle = () => {
    playChoice = { playing: !playing, reduce }
    playListeners.forEach((listener) => listener())
  }
  return [playing, toggle] as const
}

interface StageFit {
  /** Stage width in units. */
  w: number
  scale: number
  /** Offset of the scaled stage inside the container, in pixels, centring any cover-fit crop. */
  x: number
  y: number
}

/**
 * Fits the stage to the container. The 9:16 artboard scales to the container's width. A fluid stage takes the
 * container's aspect within the stage's width range and cover-fits, centred, beyond it.
 */
function useStageFit(ref: RefObject<HTMLElement | null>, fluid: boolean) {
  const [fit, setFit] = useState<StageFit>({ w: STAGE.w, scale: 0, x: 0, y: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const { clientWidth: width, clientHeight: height } = el
      if (!fluid || !height) return setFit({ w: STAGE.w, scale: width / STAGE.w, x: 0, y: 0 })
      const w = fluidWidth(width / height)
      const scale = Math.max(width / w, height / STAGE.h)
      setFit({ w, scale, x: (width - w * scale) / 2, y: (height - STAGE.h * scale) / 2 })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, fluid])
  return fit
}

/** Advances reel time on the animation frame loop while `running`, wrapping at the end of the loop. */
function useClock(t: MotionValue<number>, loop: number, running: boolean) {
  useEffect(() => {
    if (!running) return
    const tick = ({ delta }: FrameData) => t.set((t.get() + delta / 1000) % loop)
    frame.update(tick, true)
    return () => cancelFrame(tick)
  }, [running, t, loop])
}

interface SceneClipProps {
  c: Concept
  t: MotionValue<number>
  start: number
  length: number
  Scene: ComponentType<SceneProps>
  /** The concept's cut, which wipes this scene in over its first `reel.cut` seconds. */
  cutIn: (k: number, w: number) => CutStyle
  /** Reel time after which this clip hides, for the outgoing scene under a cut. */
  until?: number
}

/** Mounts one scene, hands it its own 0 to 1 progress through the clip, and wipes it in with the concept's cut. */
function SceneClip({ c, t, start, length, Scene, cutIn, until }: SceneClipProps) {
  const { w } = useStage()
  const p = useTransform(t, [start, start + length], [0, 1])
  const k = useTransform(t, [start, start + reel.cut], [reel.cutHead, 1], { ease: settleEase })
  const clipPath = useTransform(k, (v) => cutIn(v, w).clipPath)
  const x = useTransform(k, (v) => cutIn(v, w).x)
  const visibility = useTransform(t, (v) => (until === undefined || v < until ? 'visible' : 'hidden'))
  return (
    <motion.div className="absolute inset-0" style={{ clipPath, x, visibility }}>
      <Scene c={c} p={p} />
    </motion.div>
  )
}

const lookKey = ({ mode, recolor }: MarkLook) => `${mode}${JSON.stringify(recolor ?? {})}`

/** The mark's signature move as motion values, at rest unless `move` is given. */
function useMarkMove(t: MotionValue<number>, start: number, move: MarkMove | undefined) {
  const at = move?.at ?? [0, 1]
  const m = useTransform(t, [start, start + (move?.duration ?? 1)], [0, 1])
  const track = <T,>(values: T[] | undefined, rest: T) => values ?? at.map(() => rest)
  return {
    y: useTransform(m, at, track(move?.y, 0), { ease: settleEase }),
    scale: useTransform(m, at, track(move?.scale, 1), { ease: settleEase }),
    scaleX: useTransform(m, at, track(move?.scaleX, 1), { ease: settleEase }),
    rotate: useTransform(m, at, track(move?.rotate, 0), { ease: settleEase }),
    opacity: useTransform(m, at, track(move?.opacity, 1), { ease: settleEase }),
    clipPath: useTransform(m, at, track(move?.clipPath, 'none'), { ease: settleEase }),
  }
}

interface LockedMarkProps {
  c: Concept
  plan: Reel
  look: MarkLook
  t: MotionValue<number>
  start: number
  move?: MarkMove
}

/**
 * The mark, in the same box in every scene. Every artwork variant the concept's reel uses stays mounted and decoded,
 * and a cut only switches which one shows, so the mark never blinks on a cut. On signature scenes it plays the
 * concept's move in place and settles back into the same box.
 */
function LockedMark({ c, plan, look, t, start, move }: LockedMarkProps) {
  const variants = useMemo(() => {
    const looks = plan.scenes.map((s) => scenes[s.id].mark(c))
    return [...new Map(looks.map((l) => [lookKey(l), markUri(c.id, l.mode, l.recolor)])).entries()]
  }, [c, plan])
  const s = useStage()
  const style = useMarkMove(t, start, move)
  const active = lookKey(look)
  const plate = look.plate && PLATE[look.plate]
  return (
    <>
      {plate && (
        <div
          // Hairline edge and drop shadow keep a dark tile legible on a dark scene.
          className="absolute shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16),0_18px_40px_-14px_rgb(0_0_0/0.55)]"
          style={{ ...centred(s, plate), background: c.favicon.bg, borderRadius: look.plate === 'circle' ? '50%' : plate * ICON_RADIUS }}
        />
      )}
      <motion.div className="absolute" style={{ ...centred(s, MARK.w, MARK.h), ...style }}>
        {variants.map(([key, src]) => (
          <img key={key} src={src} alt="" className="absolute inset-0 size-full object-contain" style={{ opacity: key === active ? 1 : 0 }} />
        ))}
      </motion.div>
    </>
  )
}

interface PlayToggleProps {
  name: string
  playing: boolean
  onToggle: () => void
  className: string
}

function PlayToggle({ name, playing, onToggle, className }: PlayToggleProps) {
  const Icon = playing ? Pause : Play
  return (
    <motion.button type="button" {...press} onClick={onToggle} aria-label={`${playing ? 'Pause' : 'Play'} ${name}`} className={`${reelControl} ${className}`}>
      <Icon size={18} weight="fill" />
    </motion.button>
  )
}
