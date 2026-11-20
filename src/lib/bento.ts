/**
 * Justified photo rows. Every photo keeps its own aspect ratio, so nothing is ever cropped (these are brand mockups:
 * logos and headlines run right to the edges of the posters and social grids), and each row is scaled to fill the
 * full width at one shared height. Rows keep the photos in order and are chosen so each row's summed aspect ratio
 * sits as close as possible to a target: a higher target puts more, shorter photos in a row.
 */
export interface RowRule {
  /** Summed aspect ratio a row aims for. Row height is roughly (width - gaps) / target. */
  target: number
  /** Target for the opening row, lower so the first photo reads larger. Defaults to `target`. */
  first?: number
  /** No row of two or more photos sums past this, so thumbnails never get too short. A lone photo always fits. */
  max?: number
}

export interface RowPlace {
  /** This photo's share of its row's width once the gaps are taken out, 0 to 1. */
  share: number
  /** Photos in the row, to know how many gaps it has. */
  count: number
}

/** Portraits read as portraits below this aspect ratio. */
export const PORTRAIT_BELOW = 0.9

export function packRows(ratios: number[], { target, first = target, max = Infinity }: RowRule): RowPlace[] {
  const n = ratios.length
  const sum = (from: number, to: number) => ratios.slice(from, to).reduce((s, r) => s + r, 0)
  // best[i] is the lowest cost of laying out the first i photos; cut[i] is where that layout's last row starts.
  const best = [0, ...Array<number>(n).fill(Infinity)]
  const cut = Array<number>(n + 1).fill(0)
  for (let end = 1; end <= n; end++) {
    for (let start = end - 1; start >= 0; start--) {
      const s = sum(start, end)
      if (s > max && end - start > 1) break
      const cost = best[start] + Math.log(s / (start === 0 ? first : target)) ** 2
      if (cost < best[end]) {
        best[end] = cost
        cut[end] = start
      }
    }
  }
  const places: RowPlace[] = []
  for (let end = n; end > 0; end = cut[end]) {
    const start = cut[end]
    const s = sum(start, end)
    places.unshift(...ratios.slice(start, end).map((r) => ({ share: r / s, count: end - start })))
  }
  return places
}
