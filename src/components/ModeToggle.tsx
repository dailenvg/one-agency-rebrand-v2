import { AnimatePresence, motion } from 'motion/react'
import { Moon, Sun } from '@phosphor-icons/react'
import { useAccentEdge } from '../lib/hooks'
import { duration, press, spring } from '../lib/motion'
import { useTheme } from '../theme/context'

/**
 * Light and dark as a sliding switch: the thumb carries the active icon, the track shows the other one. `compact`
 * (the scrolled bar on phones) shrinks the track to a 44px well around the thumb, so the concept segments keep 44px on
 * the same row; the thumb still swaps its icon on toggle.
 */
export function ModeToggle({ onHero, compact = false }: { onHero: boolean; compact?: boolean }) {
  const { mode, toggleMode } = useTheme()
  const edge = useAccentEdge(onHero)
  const dark = mode === 'dark'
  return (
    <motion.button
      {...press}
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleMode}
      className="group inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full"
    >
      <span
        className={`relative flex h-11 items-center rounded-full p-1 transition-colors ${
          compact ? 'w-11 justify-center' : `w-20 ${dark ? 'justify-end' : 'justify-start'}`
        } ${onHero ? 'bg-white/8 text-hero-ink/60 group-hover:bg-white/14' : 'bg-surface2 text-muted group-hover:text-ink'}`}
      >
        {!compact && (
          <>
            <Sun aria-hidden size={16} className="absolute left-3.5" />
            <Moon aria-hidden size={16} className="absolute right-3.5" />
          </>
        )}
        <motion.span
          layout
          transition={spring.snappy}
          className={`relative grid size-9 place-items-center rounded-full bg-accent text-accent-ink shadow-soft ${edge}`}
          style={{ borderRadius: 999 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mode}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: duration.micro }}
            >
              {dark ? <Moon aria-hidden size={16} /> : <Sun aria-hidden size={16} />}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </span>
    </motion.button>
  )
}
