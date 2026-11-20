export function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function channel(v: number) {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The lowest opacity, from `base` up in 5% steps, at which `fg` laid over `bg` still clears `min`:1. Secondary text
 * keeps its softer tone wherever the colours allow it and firms up only where that tone would fall under AA (white at
 * 60% on a mid-tone violet falls short, for one).
 */
export function readableAlpha(fg: string, bg: string, base: number, min = 4.5) {
  const f = hexToRgb(fg)
  const b = hexToRgb(bg)
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  for (let step = Math.round(base * 20); step < 20; step++) {
    const a = step / 20
    const mixed = `#${hex(f.r * a + b.r * (1 - a))}${hex(f.g * a + b.g * (1 - a))}${hex(f.b * a + b.b * (1 - a))}`
    if (contrast(mixed, bg) >= min) return a
  }
  return 1
}

/** Readable ink (near black or white) for text set on `hex`. */
export function inkOn(hex: string) {
  return contrast(hex, '#0A0A0A') >= contrast(hex, '#FFFFFF') ? '#0A0A0A' : '#FFFFFF'
}

export function rgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return `${r} ${g} ${b}`
}

export function cmyk(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const k = 1 - Math.max(r, g, b) / 255
  if (k === 1) return '0 0 0 100'
  const f = (c: number) => Math.round(((1 - c / 255 - k) / (1 - k)) * 100)
  return `${f(r)} ${f(g)} ${f(b)} ${Math.round(k * 100)}`
}
