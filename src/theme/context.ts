import { createContext, useContext } from 'react'
import type { Concept, ConceptId, Mode } from '../data/concepts'

export interface ThemeValue {
  concept: Concept
  mode: Mode
  /** Applies a concept. Returns true when a wipe started (the swap happens under it). */
  select: (id: ConceptId) => boolean
  toggleMode: () => void
}

export const ThemeContext = createContext<ThemeValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
