import { motion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react'
import { company, concepts } from '../data/concepts'
import { logoUrl, wideLogo } from '../lib/logos'
import { duration, ease, viewport } from '../lib/motion'
import { useTheme } from '../theme/context'
import { SectionEyebrow } from './ui/primitives'

const links = [
  { href: '#brief', label: 'Brief' },
  { href: '#kit', label: 'Brand kit' },
  { href: '#concepts', label: 'All concepts' },
]

const row = 'flex min-h-11 w-full items-center justify-between gap-4 border-b border-hero-ink/10 text-left text-sm transition-colors'

export function Footer() {
  const { concept, select } = useTheme()
  return (
    <footer className="guides guides-hero overflow-hidden bg-hero pt-module text-hero-ink">
      <div className="container-x">
        <div className="grid gap-y-12 pb-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 md:pr-12">
            <img src={logoUrl(concept.id, wideLogo(concept.id), 'dark')} alt={`ONE Agency, ${concept.name}`} className="h-8 w-auto" />
            <p className="mt-6 max-w-sm text-hero-ink/70 text-pretty">
              Rebrand concepts prepared for {company.name}. {company.promise}
            </p>
            <p className="mt-3 text-sm text-hero-ink/70">
              Designed by <span className="text-glow">Dailen Vazquez</span> - Senior Designer | ONE Agency
            </p>
          </div>
          <div className="md:pr-8">
            <SectionEyebrow index={String(concepts.length).padStart(2, '0')} onHero>
              Concepts
            </SectionEyebrow>
            <ul className="mt-5 border-t border-hero-ink/10">
              {concepts.map((c) => {
                const on = c.id === concept.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c.id)}
                      aria-pressed={on}
                      className={`${row} cursor-pointer ${on ? 'font-semibold text-glow' : 'text-hero-ink/75 hover:text-hero-ink'}`}
                    >
                      {/* A dot as well as the colour, so the current concept never relies on colour alone. */}
                      <span className="flex items-center gap-2">
                        <span aria-hidden className={`size-2 rounded-full ${on ? 'bg-glow' : 'bg-transparent'}`} />
                        {c.name}
                      </span>
                      <span className="font-mono text-xs tabular-nums opacity-70">{c.index}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <SectionEyebrow index={String(links.length).padStart(2, '0')} onHero>
              Sections
            </SectionEyebrow>
            <ul className="mt-5 border-t border-hero-ink/10">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={`${row} group text-hero-ink/75 hover:text-hero-ink`}>
                    {l.label}
                    <ArrowUpRight aria-hidden size={14} className="opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <motion.div
        key={concept.id}
        className="container-x py-stack"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: duration.page * 1.4, ease: ease.out }}
      >
        <img src={logoUrl(concept.id, wideLogo(concept.id), 'dark')} alt="" className="w-full" />
      </motion.div>
      <div className="border-t border-hero-ink/10">
        <div className="container-x label flex flex-col justify-between gap-2 py-6 text-[10px] text-hero-ink/60 sm:flex-row">
          <span>© 2026 {company.name}. Concept presentation, not for public release.</span>
          <span>{company.positioning}</span>
        </div>
      </div>
    </footer>
  )
}
