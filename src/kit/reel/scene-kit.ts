import { cubicBezier, useTransform, type MotionValue } from 'motion/react'
import type { Concept } from '../../data/concepts'
import { reel } from '../../lib/motion'

/** `p` runs 0 to 1 across the scene, so every in-scene move is a pure function of reel time. */
export interface SceneProps {
  c: Concept
  p: MotionValue<number>
}

/** The reel's easing curve as a function, for transforms of reel time. */
export const settleEase = cubicBezier(...reel.ease)

/** Eases a value from `from` to `to` over `span` of the scene (the settle window), starting `delay` in. */
export function useSettle<T>(p: MotionValue<number>, from: T, to: T, delay = 0, span: number = reel.settle) {
  return useTransform(p, [delay, delay + span], [from, to], { ease: settleEase })
}

/** Linear drift across the whole scene, for moves that should never stop. */
export function useDrift(p: MotionValue<number>, from: number, to: number) {
  return useTransform(p, [0, 1], [from, to])
}

export const mix = (color: string, amount: number, base = 'transparent') => `color-mix(in srgb, ${color} ${amount}%, ${base})`

export const softShadow = '0 18px 40px -18px rgb(0 0 0 / 0.45)'

/** A palette colour by its swatch name, for the scenes that speak in one concept's own colours. */
export function swatch(c: Concept, name: string) {
  const hex = c.palette.find((s) => s.name === name)?.hex
  if (!hex) throw new Error(`${c.name} has no swatch named “${name}”`)
  return hex
}

export const range = (n: number) => Array.from({ length: n }, (_, i) => i)
