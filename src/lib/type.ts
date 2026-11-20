import type { CSSProperties } from 'react'
import type { Concept } from '../data/concepts'

/**
 * Sets text in a concept's display face regardless of the applied theme.
 * Also exposes the face's optical scale as `--x-scale` for calc() font sizes.
 */
export function displayStyle(c: Concept): CSSProperties {
  return {
    fontFamily: c.type.display.stack,
    fontWeight: c.type.display.weight,
    fontStretch: c.type.display.stretch,
    letterSpacing: c.type.display.tracking,
    ['--x-scale' as string]: c.type.display.scale ?? 1,
  }
}
