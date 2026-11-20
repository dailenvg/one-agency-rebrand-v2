import { createContext, useContext } from 'react'
import type { Mode } from '../../data/concepts'

/**
 * The reel is designed 640 units tall on a 9:16 artboard. The logo banner widens the same artboard to its container's
 * aspect, so scenes lay themselves out on whatever width they are given and the mark stays locked at the centre.
 */
export const STAGE = { w: 360, h: 640 } as const

/**
 * Widths a fluid stage may take. Narrower containers (portrait phones) keep the 9:16 artboard and crop its sides by
 * cover-fit rather than squeezing the designs; wider ones (beyond ultrawide) cover-fit the widest stage.
 */
export const STAGE_WIDTH = { min: STAGE.w, max: 1500 } as const

/**
 * GIF export sizes, in CSS pixels, captured at `density` device pixels per CSS pixel. The 9:16 reel renders at 1.5x
 * the artboard; the 16:9 banner renders at its output size and is supersampled for clean edges.
 */
export const EXPORT = {
  portrait: { w: STAGE.w * 1.5, h: STAGE.h * 1.5, density: 1 },
  banner: { w: 960, h: 540, density: 2 },
} as const

export type ReelFormat = keyof typeof EXPORT

/** Box the mark is fitted into, locked at the centre of every scene. */
export const MARK = { w: 112, h: 80 } as const

/** Brand app tile and avatar disc that sit behind the mark in some scenes. */
export const PLATE = { tile: 152, circle: 168 } as const

/** App tile corner radius as a share of its size, matching the generated app icons. */
export const ICON_RADIUS = 0.225

/** How the locked mark is drawn in a scene: which artwork, and whether it sits on the brand app tile or avatar. */
export interface MarkLook {
  mode: Mode
  recolor?: Record<string, string>
  plate?: keyof typeof PLATE
}

/** The artboard a reel is drawn on: its size and centre, in stage units. */
export interface Stage {
  w: number
  h: number
  cx: number
  cy: number
}

export const stageOf = (w: number): Stage => ({ w, h: STAGE.h, cx: w / 2, cy: STAGE.h / 2 })

/** The fixed 9:16 artboard. */
export const PORTRAIT = stageOf(STAGE.w)

/** Stage width for a container of the given width / height aspect, in whole units. */
export const fluidWidth = (aspect: number) => Math.round(Math.min(STAGE_WIDTH.max, Math.max(STAGE_WIDTH.min, aspect * STAGE.h)))

/** Width beyond the 9:16 artboard, the room a scene has to compose for landscape. Zero on the portrait reel. */
export const extraWidth = (s: Stage) => s.w - STAGE.w

/** True once a stage is wide enough for scenes to switch to a landscape composition. */
export const isWide = (s: Stage) => s.w >= 720

const StageContext = createContext<Stage>(PORTRAIT)

export const StageProvider = StageContext.Provider

/** The stage the current scene is drawn on. Defaults to the 9:16 artboard. */
export const useStage = () => useContext(StageContext)

/** Absolute box of a given size centred on the stage. */
export function centred(s: Stage, w: number, h = w) {
  return { left: s.cx - w / 2, top: s.cy - h / 2, width: w, height: h }
}

/**
 * A horizontally centred text column: `inset` units from each edge on the portrait artboard, never wider than `max`.
 * On the 9:16 stage it matches `inset-x-<inset>`, so portrait layouts are unchanged.
 */
export function column(s: Stage, inset: number, max: number) {
  const width = Math.min(s.w - inset * 2, max)
  return { left: (s.w - width) / 2, width }
}
