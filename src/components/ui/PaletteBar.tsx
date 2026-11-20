import type { Concept } from '../../data/concepts'

/** A concept's palette as one proportional bar, each colour sized by its share of a layout. */
export function PaletteBar({ c, className = '' }: { c: Concept; className?: string }) {
  return (
    <span aria-hidden className={`flex overflow-hidden rounded-full ${className}`}>
      {c.palette.map((s) => (
        <span key={s.hex} style={{ background: s.hex, flexGrow: s.share }} />
      ))}
    </span>
  )
}
