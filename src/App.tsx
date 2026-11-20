import { IconContext } from '@phosphor-icons/react'
import { MotionConfig } from 'motion/react'
import { Brief } from './components/Brief'
import { ConceptExplorer } from './components/ConceptExplorer'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { Nav } from './components/Nav'
import { BrandKit } from './kit/BrandKit'
import { ThemeProvider } from './theme/ThemeContext'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <IconContext.Provider value={{ weight: 'bold' }}>
      <ThemeProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
          Skip to content
        </a>
        <Nav />
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <Brief />
          <Marquee />
          <BrandKit />
          <ConceptExplorer />
        </main>
        <Footer />
      </ThemeProvider>
      </IconContext.Provider>
    </MotionConfig>
  )
}
