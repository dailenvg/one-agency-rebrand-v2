import type { ConceptId } from '../data/concepts'
import { reel } from './motion'

/** Application scenes any concept can use. */
export type SharedSceneId = 'skyline' | 'dock' | 'steps' | 'guides' | 'web' | 'card' | 'gradient' | 'profile' | 'construction' | 'story'

/** Scenes built from one concept's idea and graphic language, used by that concept only. */
export type SignatureSceneId =
  | 'nova-orbit' | 'nova-frames' | 'nova-corner'
  | 'volt-field' | 'volt-spotlight' | 'volt-reveal'
  | 'arc-rise' | 'arc-turns' | 'arc-chart'
  | 'pill-capsules' | 'pill-funnel' | 'pill-toggle'

export type ReelSceneId = SharedSceneId | SignatureSceneId

export interface ReelScene {
  id: ReelSceneId
  label: string
  /** Scene length in beats of `reel.scene` seconds. */
  beats: number
  /** The locked mark plays its concept's signature move as this scene cuts in. */
  move: boolean
}

export interface Reel {
  scenes: ReelScene[]
  /** First beat of each scene. */
  starts: number[]
  /** Loop length in seconds. */
  loop: number
  /** The still shown under reduced motion, in seconds: the closing card, fully settled. */
  poster: number
}

const label: Record<SharedSceneId, string> = {
  skyline: 'Skyline',
  dock: 'App dock',
  steps: 'Brand colour',
  guides: 'Guidelines',
  web: 'Website',
  card: 'Business card',
  gradient: 'Gradient',
  profile: 'App profile',
  construction: 'Construction',
  story: 'Story ring',
}

const shared = (id: SharedSceneId): ReelScene => ({ id, label: label[id], beats: 1, move: false })
const signature = (id: SignatureSceneId, name: string, beats = 1, move = true): ReelScene => ({ id, label: name, beats, move })

/**
 * Each concept's reel, opening to closing card. The closing card holds for `reel.endHold` extra beats and carries the
 * concept's tagline. Orders are graded by lightness (dark, brand colour, light, brand colour, dark, and round the
 * loop) so no cut jumps straight between a near-black frame and a near-white one.
 */
const orders: Record<ConceptId, ReelScene[]> = {
  nova: [
    signature('nova-orbit', 'Orbit lines', 2),
    shared('steps'),
    signature('nova-frames', 'Capsule frames', 1, false),
    shared('guides'),
    shared('card'),
    shared('gradient'),
    shared('story'),
    signature('nova-corner', 'The square corner'),
  ],
  volt: [
    signature('volt-field', 'Staggered marks', 2, false),
    signature('volt-spotlight', 'Lime spotlight'),
    shared('steps'),
    shared('guides'),
    shared('card'),
    shared('gradient'),
    shared('construction'),
    signature('volt-reveal', 'The 1 inside the O'),
  ],
  arc: [
    signature('arc-rise', 'Rising arcs', 2),
    shared('skyline'),
    signature('arc-turns', 'Quarter turns', 2, false),
    shared('guides'),
    shared('web'),
    shared('card'),
    shared('gradient'),
    signature('arc-chart', 'Keeps rising'),
  ],
  pill: [
    signature('pill-capsules', 'Progress capsules'),
    shared('gradient'),
    shared('web'),
    signature('pill-funnel', 'Full funnel', 2),
    shared('card'),
    shared('steps'),
    shared('profile'),
    signature('pill-toggle', 'Intent to revenue'),
  ],
}

/**
 * Share of a scene where the reduced-motion still is taken. Staggered items settle as late as `settle` plus a few
 * `stagger` steps, so the still sits just before the cut, once every move has landed.
 */
const POSTER_AT = 0.98

function buildReel(order: ReelScene[]): Reel {
  const scenes = order.map((s, i) => (i === order.length - 1 ? { ...s, beats: s.beats + reel.endHold } : s))
  const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((sum, s) => sum + s.beats, 0))
  const totalBeats = starts.at(-1)! + scenes.at(-1)!.beats
  const closing = scenes.length - 1
  return {
    scenes,
    starts,
    loop: totalBeats * reel.scene,
    poster: (starts[closing] + scenes[closing].beats * POSTER_AT) * reel.scene,
  }
}

const reels = Object.fromEntries(Object.entries(orders).map(([id, order]) => [id, buildReel(order)])) as Record<ConceptId, Reel>

export const reelFor = (id: ConceptId) => reels[id]

/** Rounding slack so a time sampled exactly on a cut (a whole number of frames) lands on the new scene. */
const EPSILON = 1e-6

/** Index of the scene showing at `time` seconds. */
export function sceneAt({ starts, loop }: Reel, time: number) {
  const beat = Math.floor((((time % loop) + loop) % loop) / reel.scene + EPSILON)
  return starts.findLastIndex((s) => s <= beat)
}

/** Start and length of a scene, in seconds. */
export function sceneSpan({ starts, scenes }: Reel, index: number) {
  return { start: starts[index] * reel.scene, length: scenes[index].beats * reel.scene }
}
